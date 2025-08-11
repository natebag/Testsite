/**
 * MLG.clan Platform API Load Testing Suite
 * 
 * Comprehensive load testing for all API endpoints with realistic gaming scenarios.
 * Tests API performance under various load conditions with concurrent users,
 * measures response times, throughput, and error rates.
 * 
 * Features:
 * - Realistic gaming user scenarios (authentication, clan operations, voting)
 * - Configurable concurrent user simulation
 * - Response time and throughput measurements
 * - Error rate monitoring and analysis
 * - Resource utilization tracking
 * - Detailed performance reporting
 * 
 * @author Claude Code - Universal Testing & Verification Agent
 * @version 1.0.0
 * @created 2025-08-11
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let authenticatedUsers = new Counter('authenticated_users');
export let clanOperations = new Counter('clan_operations');
export let votingOperations = new Counter('voting_operations');
export let contentOperations = new Counter('content_operations');
export let websocketConnections = new Counter('websocket_connections');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';

// Load test scenarios
export let options = {
  scenarios: {
    // Gradual ramp-up to 1000+ users
    'ramp_up_load': {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 200 },  // Ramp up to 200 users
        { duration: '5m', target: 500 },  // Ramp up to 500 users
        { duration: '10m', target: 1000 }, // Ramp up to 1000 users
        { duration: '15m', target: 1000 }, // Stay at 1000 users
        { duration: '5m', target: 500 },  // Ramp down to 500
        { duration: '3m', target: 200 },  // Ramp down to 200
        { duration: '2m', target: 0 },    // Ramp down to 0
      ],
    },
    
    // Spike test - sudden load increases
    'spike_test': {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '1m', target: 50 },   // Normal load
        { duration: '30s', target: 1500 }, // Sudden spike
        { duration: '2m', target: 1500 },  // Maintain spike
        { duration: '30s', target: 50 },   // Drop back
        { duration: '1m', target: 50 },    // Recover
      ],
    },
    
    // Stress test - beyond normal capacity
    'stress_test': {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '2m', target: 2000 },  // Beyond capacity
        { duration: '10m', target: 2000 }, // Maintain stress
        { duration: '2m', target: 100 },   // Recovery
      ],
    },
    
    // Endurance test - sustained load
    'endurance_test': {
      executor: 'constant-vus',
      vus: 500,
      duration: '30m',
    }
  },
  
  thresholds: {
    // Response time thresholds
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'http_req_duration{expected_response:true}': ['p(95)<1500'],
    
    // Error rate thresholds
    'http_req_failed': ['rate<0.05'], // Error rate < 5%
    'errors': ['rate<0.05'],
    
    // Throughput thresholds
    'http_reqs': ['rate>100'], // At least 100 requests per second
    
    // Custom thresholds
    'response_time': ['p(95)<2000'],
    'authenticated_users': ['count>100'],
    'clan_operations': ['count>50'],
    'voting_operations': ['count>30'],
  },
};

/**
 * Test data generation
 */
const generateTestUser = () => ({
  walletAddress: `MLG${Math.random().toString(36).substring(2, 15)}`,
  username: `testuser_${Math.random().toString(36).substring(2, 10)}`,
  email: `test${Math.random().toString(36).substring(2, 10)}@mlg.clan`,
});

const generateTestClan = () => ({
  name: `TestClan_${Math.random().toString(36).substring(2, 10)}`,
  description: `Load test clan created at ${new Date().toISOString()}`,
  isPublic: Math.random() > 0.5,
});

const generateTestContent = () => ({
  title: `Test Content ${Math.random().toString(36).substring(2, 10)}`,
  description: `Load test content created at ${new Date().toISOString()}`,
  type: Math.random() > 0.5 ? 'video' : 'image',
  url: `https://example.com/content/${Math.random().toString(36).substring(2, 15)}`,
});

/**
 * Authentication functions
 */
function authenticateUser() {
  const user = generateTestUser();
  
  // Simulate Phantom wallet authentication
  const authPayload = {
    walletAddress: user.walletAddress,
    signature: `signature_${Math.random().toString(36).substring(2, 20)}`,
    message: `MLG.clan authentication for ${user.walletAddress}`,
  };
  
  const response = http.post(`${API_BASE}/auth/phantom`, JSON.stringify(authPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const success = check(response, {
    'auth status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'auth response time < 1000ms': (r) => r.timings.duration < 1000,
    'auth returns token': (r) => r.json('token') !== undefined,
  });
  
  if (success) {
    authenticatedUsers.add(1);
    return {
      token: response.json('token'),
      userId: response.json('user.id'),
      walletAddress: user.walletAddress,
    };
  }
  
  errorRate.add(!success);
  return null;
}

function refreshToken(token) {
  const response = http.post(`${API_BASE}/auth/refresh`, null, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const success = check(response, {
    'token refresh status is 200': (r) => r.status === 200,
    'token refresh response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  return success ? response.json('token') : null;
}

/**
 * Clan operations
 */
function clanOperations(authToken) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
  
  // Create clan
  const clanData = generateTestClan();
  let response = http.post(`${API_BASE}/clans`, JSON.stringify(clanData), { headers });
  
  let success = check(response, {
    'clan creation status is 201': (r) => r.status === 201,
    'clan creation response time < 1500ms': (r) => r.timings.duration < 1500,
  });
  
  errorRate.add(!success);
  
  if (!success) return;
  
  const clanId = response.json('id');
  clanOperations.add(1);
  
  // Get clan details
  response = http.get(`${API_BASE}/clans/${clanId}`, { headers });
  
  success = check(response, {
    'clan details status is 200': (r) => r.status === 200,
    'clan details response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  
  // Get clan leaderboard
  response = http.get(`${API_BASE}/clans/${clanId}/leaderboard`, { headers });
  
  success = check(response, {
    'clan leaderboard status is 200': (r) => r.status === 200,
    'clan leaderboard response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  
  // Update clan
  const updateData = { description: `Updated at ${new Date().toISOString()}` };
  response = http.patch(`${API_BASE}/clans/${clanId}`, JSON.stringify(updateData), { headers });
  
  success = check(response, {
    'clan update status is 200': (r) => r.status === 200,
    'clan update response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  clanOperations.add(1);
  
  return clanId;
}

/**
 * Voting operations
 */
function votingOperations(authToken, clanId) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
  
  // Create voting session
  const votingData = {
    title: `Load Test Vote ${Math.random().toString(36).substring(2, 10)}`,
    description: 'Load testing voting system',
    options: ['Option A', 'Option B', 'Option C'],
    duration: 3600, // 1 hour
    tokenCost: Math.floor(Math.random() * 100) + 10,
  };
  
  let response = http.post(`${API_BASE}/voting/sessions`, JSON.stringify(votingData), { headers });
  
  let success = check(response, {
    'voting session creation status is 201': (r) => r.status === 201,
    'voting session creation response time < 1500ms': (r) => r.timings.duration < 1500,
  });
  
  errorRate.add(!success);
  
  if (!success) return;
  
  const sessionId = response.json('id');
  votingOperations.add(1);
  
  // Cast vote (burn-to-vote)
  const voteData = {
    sessionId,
    option: Math.floor(Math.random() * 3),
    tokenAmount: Math.floor(Math.random() * 50) + 5,
    transactionSignature: `vote_sig_${Math.random().toString(36).substring(2, 20)}`,
  };
  
  response = http.post(`${API_BASE}/voting/vote`, JSON.stringify(voteData), { headers });
  
  success = check(response, {
    'vote casting status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'vote casting response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  
  // Get voting results
  response = http.get(`${API_BASE}/voting/sessions/${sessionId}/results`, { headers });
  
  success = check(response, {
    'voting results status is 200': (r) => r.status === 200,
    'voting results response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  votingOperations.add(1);
}

/**
 * Content operations
 */
function contentOperations(authToken, clanId) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
  
  // Submit content
  const contentData = generateTestContent();
  if (clanId) {
    contentData.clanId = clanId;
  }
  
  let response = http.post(`${API_BASE}/content`, JSON.stringify(contentData), { headers });
  
  let success = check(response, {
    'content submission status is 201': (r) => r.status === 201,
    'content submission response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  
  if (!success) return;
  
  const contentId = response.json('id');
  contentOperations.add(1);
  
  // Get trending content
  response = http.get(`${API_BASE}/content/trending?limit=20`, { headers });
  
  success = check(response, {
    'trending content status is 200': (r) => r.status === 200,
    'trending content response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  
  // Rate content
  const ratingData = {
    contentId,
    rating: Math.floor(Math.random() * 5) + 1,
  };
  
  response = http.post(`${API_BASE}/content/rate`, JSON.stringify(ratingData), { headers });
  
  success = check(response, {
    'content rating status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'content rating response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  contentOperations.add(1);
}

/**
 * WebSocket testing
 */
function websocketTest(authToken) {
  const wsUrl = `${WS_URL}?token=${authToken}`;
  
  const response = ws.connect(wsUrl, null, function (socket) {
    websocketConnections.add(1);
    
    socket.on('open', () => {
      // Authenticate
      socket.send(JSON.stringify({
        type: 'authenticate',
        token: authToken,
      }));
      
      // Join clan channel
      socket.send(JSON.stringify({
        type: 'join_clan',
        clanId: 'test_clan_123',
      }));
      
      // Subscribe to voting updates
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'voting_updates',
      }));
    });
    
    socket.on('message', (data) => {
      const message = JSON.parse(data);
      
      // Respond to ping
      if (message.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
      }
    });
    
    socket.setTimeout(() => {
      socket.close();
    }, 10000); // Keep connection for 10 seconds
    
  });
  
  check(response, {
    'websocket connection successful': (r) => r && r.status === 101,
  });
}

/**
 * Transaction operations
 */
function transactionOperations(authToken) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
  
  // Get transaction history
  let response = http.get(`${API_BASE}/transactions?limit=10`, { headers });
  
  let success = check(response, {
    'transaction history status is 200': (r) => r.status === 200,
    'transaction history response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
  
  // Verify transaction
  const transactionData = {
    signature: `tx_sig_${Math.random().toString(36).substring(2, 20)}`,
    amount: Math.floor(Math.random() * 1000) + 100,
    type: 'burn_to_vote',
  };
  
  response = http.post(`${API_BASE}/transactions/verify`, JSON.stringify(transactionData), { headers });
  
  success = check(response, {
    'transaction verification status is 200': (r) => r.status === 200,
    'transaction verification response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
}

/**
 * Main test function - realistic gaming scenario
 */
export default function () {
  const startTime = Date.now();
  
  // Authenticate user
  const auth = authenticateUser();
  if (!auth) {
    sleep(1);
    return;
  }
  
  // Simulate user journey
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - Clan-focused users
    const clanId = clanOperations(auth.token);
    if (clanId) {
      votingOperations(auth.token, clanId);
      contentOperations(auth.token, clanId);
    }
    
  } else if (scenario < 0.6) {
    // 30% - Content-focused users
    contentOperations(auth.token);
    transactionOperations(auth.token);
    
  } else if (scenario < 0.8) {
    // 20% - Voting-focused users
    votingOperations(auth.token);
    transactionOperations(auth.token);
    
  } else {
    // 20% - Mixed activity users
    const clanId = clanOperations(auth.token);
    contentOperations(auth.token, clanId);
    votingOperations(auth.token, clanId);
    transactionOperations(auth.token);
    websocketTest(auth.token);
  }
  
  // Random token refresh (10% chance)
  if (Math.random() < 0.1) {
    refreshToken(auth.token);
  }
  
  // Record total response time
  responseTime.add(Date.now() - startTime);
  
  // Random sleep between 1-3 seconds to simulate human behavior
  sleep(Math.random() * 2 + 1);
}

/**
 * Setup function - runs once before all tests
 */
export function setup() {
  console.log('Starting MLG.clan Load Test Suite');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`WebSocket URL: ${WS_URL}`);
  
  // Health check
  const healthResponse = http.get(`${API_BASE}/health`);
  
  if (healthResponse.status !== 200) {
    throw new Error(`API health check failed: ${healthResponse.status}`);
  }
  
  console.log('API health check passed');
  
  return {
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiBase: API_BASE,
  };
}

/**
 * Teardown function - runs once after all tests
 */
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Test duration: ${new Date().toISOString()} - ${data.startTime}`);
}

/**
 * Custom summary function
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-report.json': JSON.stringify(data, null, 2),
    'load-test-summary.html': htmlReport(data),
  };
}

/**
 * Generate HTML report
 */
function htmlReport(data) {
  const metrics = data.metrics;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>MLG.clan Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007cba; }
        .passed { border-left-color: #28a745; }
        .failed { border-left-color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <h1>MLG.clan Platform Load Test Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <p><strong>Total Requests:</strong> ${metrics.http_reqs.count}</p>
        <p><strong>Success Rate:</strong> ${((1 - metrics.http_req_failed.rate) * 100).toFixed(2)}%</p>
        <p><strong>Average Response Time:</strong> ${metrics.http_req_duration.avg.toFixed(2)}ms</p>
        <p><strong>95th Percentile:</strong> ${metrics.http_req_duration['p(95)'].toFixed(2)}ms</p>
        <p><strong>Peak RPS:</strong> ${metrics.http_reqs.rate.toFixed(2)}</p>
    </div>
    
    <h2>Performance Metrics</h2>
    <table>
        <tr><th>Metric</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
        <tr><td>HTTP Request Duration (avg)</td><td>${metrics.http_req_duration.avg.toFixed(2)}ms</td><td>< 2000ms</td><td>${metrics.http_req_duration.avg < 2000 ? '✅ Pass' : '❌ Fail'}</td></tr>
        <tr><td>HTTP Request Duration (95%)</td><td>${metrics.http_req_duration['p(95)'].toFixed(2)}ms</td><td>< 2000ms</td><td>${metrics.http_req_duration['p(95)'] < 2000 ? '✅ Pass' : '❌ Fail'}</td></tr>
        <tr><td>Error Rate</td><td>${(metrics.http_req_failed.rate * 100).toFixed(2)}%</td><td>< 5%</td><td>${metrics.http_req_failed.rate < 0.05 ? '✅ Pass' : '❌ Fail'}</td></tr>
        <tr><td>Request Rate</td><td>${metrics.http_reqs.rate.toFixed(2)} req/s</td><td>> 100 req/s</td><td>${metrics.http_reqs.rate > 100 ? '✅ Pass' : '❌ Fail'}</td></tr>
    </table>
    
    <h2>Custom Metrics</h2>
    <table>
        <tr><th>Operation</th><th>Count</th><th>Rate</th></tr>
        <tr><td>Authenticated Users</td><td>${metrics.authenticated_users?.count || 0}</td><td>${(metrics.authenticated_users?.rate || 0).toFixed(2)}/s</td></tr>
        <tr><td>Clan Operations</td><td>${metrics.clan_operations?.count || 0}</td><td>${(metrics.clan_operations?.rate || 0).toFixed(2)}/s</td></tr>
        <tr><td>Voting Operations</td><td>${metrics.voting_operations?.count || 0}</td><td>${(metrics.voting_operations?.rate || 0).toFixed(2)}/s</td></tr>
        <tr><td>Content Operations</td><td>${metrics.content_operations?.count || 0}</td><td>${(metrics.content_operations?.rate || 0).toFixed(2)}/s</td></tr>
        <tr><td>WebSocket Connections</td><td>${metrics.websocket_connections?.count || 0}</td><td>${(metrics.websocket_connections?.rate || 0).toFixed(2)}/s</td></tr>
    </table>
</body>
</html>`;
}