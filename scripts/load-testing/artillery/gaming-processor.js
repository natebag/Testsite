/**
 * MLG.clan Gaming Platform - Artillery Processor
 * Custom logic for gaming-specific load testing scenarios
 */

module.exports = {
  logScenarioStart,
  logScenarioEnd,
  addTimestamp,
  captureMetrics,
  generateMockSignature,
  selectRandomUser,
  selectRandomClan,
  selectRandomContent,
  calculateGamingScore,
  simulateTokenBurn,
  validateVoteResponse,
  measureClanBattleLatency,
  trackTournamentProgress
};

// Scenario lifecycle hooks
function logScenarioStart(context, events, done) {
  console.log(`🎮 Starting gaming scenario: ${context.scenario?.name || 'Unknown'}`);
  context.vars.scenarioStartTime = Date.now();
  return done();
}

function logScenarioEnd(context, events, done) {
  const duration = Date.now() - (context.vars.scenarioStartTime || Date.now());
  console.log(`🏁 Completed scenario: ${context.scenario?.name || 'Unknown'} (${duration}ms)`);
  
  // Custom gaming metrics
  if (context.vars.votesSubmitted) {
    events.emit('counter', 'gaming.votes_submitted', context.vars.votesSubmitted);
  }
  
  if (context.vars.tokensSpent) {
    events.emit('counter', 'gaming.tokens_spent', context.vars.tokensSpent);
  }
  
  if (context.vars.clanBattleActions) {
    events.emit('counter', 'gaming.clan_battle_actions', context.vars.clanBattleActions);
  }
  
  return done();
}

// Request/Response hooks
function addTimestamp(requestParams, context, events, done) {
  context.vars._requestStart = Date.now();
  
  // Add gaming-specific headers
  if (!requestParams.headers) {
    requestParams.headers = {};
  }
  
  requestParams.headers['X-Gaming-Session'] = `session_${context.vars._uid || Math.random().toString(36)}`;
  requestParams.headers['X-Request-Id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return done();
}

function captureMetrics(requestParams, response, context, events, done) {
  const responseTime = Date.now() - (context.vars._requestStart || Date.now());
  
  // Gaming-specific response time tracking
  if (requestParams.url?.includes('/voting/')) {
    events.emit('histogram', 'gaming.vote_response_time', responseTime);
    
    // Track vote success/failure
    if (response.statusCode === 200) {
      events.emit('counter', 'gaming.successful_votes', 1);
      context.vars.votesSubmitted = (context.vars.votesSubmitted || 0) + 1;
    } else {
      events.emit('counter', 'gaming.failed_votes', 1);
    }
  }
  
  if (requestParams.url?.includes('/clan')) {
    events.emit('histogram', 'gaming.clan_response_time', responseTime);
  }
  
  if (requestParams.url?.includes('/tournament')) {
    events.emit('histogram', 'gaming.tournament_response_time', responseTime);
  }
  
  if (requestParams.url?.includes('/leaderboard')) {
    events.emit('histogram', 'gaming.leaderboard_response_time', responseTime);
    events.emit('counter', 'gaming.leaderboard_requests', 1);
  }
  
  // WebSocket message handling
  if (requestParams.type === 'websocket') {
    handleWebSocketMetrics(requestParams, response, context, events);
  }
  
  return done();
}

// Gaming-specific utility functions
function generateMockSignature() {
  // Generate a mock Solana transaction signature for testing
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  return Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function selectRandomUser(context, events, done) {
  const users = context.payload?.users || [];
  if (users.length === 0) {
    context.vars.selectedUser = generateMockUser();
  } else {
    context.vars.selectedUser = users[Math.floor(Math.random() * users.length)];
  }
  return done();
}

function selectRandomClan(context, events, done) {
  const clans = context.payload?.clans || [];
  if (clans.length === 0) {
    context.vars.selectedClan = generateMockClan();
  } else {
    context.vars.selectedClan = clans[Math.floor(Math.random() * clans.length)];
  }
  return done();
}

function selectRandomContent(context, events, done) {
  const content = context.payload?.content || [];
  if (content.length === 0) {
    context.vars.selectedContent = generateMockContent();
  } else {
    context.vars.selectedContent = content[Math.floor(Math.random() * content.length)];
  }
  return done();
}

function calculateGamingScore(context, events, done) {
  const user = context.vars.selectedUser || {};
  const baseScore = user.level || 1;
  const achievementBonus = (user.achievements || 0) * 10;
  const tokenBonus = Math.floor((user.tokenBalance || 0) / 100);
  
  context.vars.gamingScore = baseScore + achievementBonus + tokenBonus;
  return done();
}

function simulateTokenBurn(context, events, done) {
  const tokensToBurn = context.vars.tokensToBurn || 10;
  const user = context.vars.selectedUser || {};
  
  if ((user.tokenBalance || 0) >= tokensToBurn) {
    context.vars.canBurnTokens = true;
    context.vars.tokensSpent = (context.vars.tokensSpent || 0) + tokensToBurn;
    events.emit('counter', 'gaming.tokens_burned', tokensToBurn);
  } else {
    context.vars.canBurnTokens = false;
    events.emit('counter', 'gaming.insufficient_tokens', 1);
  }
  
  return done();
}

function validateVoteResponse(context, events, done) {
  const response = context.response || {};
  
  if (response.statusCode === 200 && response.body) {
    try {
      const data = JSON.parse(response.body);
      
      if (data.voteId && data.tokensBurned) {
        events.emit('counter', 'gaming.valid_vote_responses', 1);
        context.vars.lastVoteId = data.voteId;
      } else {
        events.emit('counter', 'gaming.invalid_vote_responses', 1);
      }
      
    } catch (error) {
      events.emit('counter', 'gaming.vote_parse_errors', 1);
    }
  }
  
  return done();
}

function measureClanBattleLatency(context, events, done) {
  const startTime = context.vars.clanBattleStartTime || Date.now();
  const latency = Date.now() - startTime;
  
  events.emit('histogram', 'gaming.clan_battle_latency', latency);
  
  // Track battle actions
  context.vars.clanBattleActions = (context.vars.clanBattleActions || 0) + 1;
  
  return done();
}

function trackTournamentProgress(context, events, done) {
  const tournamentData = context.vars.tournamentData || {};
  
  if (tournamentData.round) {
    events.emit('counter', `gaming.tournament_round_${tournamentData.round}`, 1);
  }
  
  if (tournamentData.matchResult) {
    events.emit('counter', `gaming.match_${tournamentData.matchResult}`, 1);
  }
  
  return done();
}

// WebSocket-specific metrics handling
function handleWebSocketMetrics(requestParams, response, context, events) {
  const messageType = requestParams.payload?.type;
  
  if (messageType) {
    events.emit('counter', `gaming.ws_message_${messageType}`, 1);
  }
  
  // Track different types of WebSocket gaming events
  switch (messageType) {
    case 'submit_vote':
      events.emit('counter', 'gaming.ws_votes_submitted', 1);
      break;
      
    case 'join_tournament':
      events.emit('counter', 'gaming.ws_tournament_joins', 1);
      break;
      
    case 'clan_battle_action':
      events.emit('counter', 'gaming.ws_clan_actions', 1);
      break;
      
    case 'get_leaderboard_position':
      events.emit('counter', 'gaming.ws_leaderboard_requests', 1);
      break;
      
    case 'send_message':
      events.emit('counter', 'gaming.ws_chat_messages', 1);
      break;
  }
}

// Mock data generators for fallback
function generateMockUser() {
  const id = Math.floor(Math.random() * 10000);
  return {
    id: `mock_user_${id}`,
    username: `gamer_${id}`,
    email: `mock${id}@mlg.clan`,
    walletAddress: generateFakeWalletAddress(),
    tokenBalance: Math.floor(Math.random() * 10000) + 100,
    level: Math.floor(Math.random() * 50) + 1,
    achievements: Math.floor(Math.random() * 10)
  };
}

function generateMockClan() {
  const id = Math.floor(Math.random() * 100);
  return {
    id: `mock_clan_${id}`,
    name: `Mock Clan ${id}`,
    memberCount: Math.floor(Math.random() * 50) + 5,
    level: Math.floor(Math.random() * 10) + 1,
    totalTokens: Math.floor(Math.random() * 100000) + 10000
  };
}

function generateMockContent() {
  const id = Math.floor(Math.random() * 1000);
  const types = ['video', 'clip', 'stream', 'tournament'];
  
  return {
    id: `mock_content_${id}`,
    title: `Mock Gaming Content ${id}`,
    type: types[Math.floor(Math.random() * types.length)],
    creatorId: `mock_user_${Math.floor(Math.random() * 10000)}`,
    votes: Math.floor(Math.random() * 1000),
    tokensEarned: Math.floor(Math.random() * 5000)
  };
}

function generateFakeWalletAddress() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}