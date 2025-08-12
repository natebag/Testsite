# MLG.clan Gaming Platform - Load Testing Framework

![MLG.clan Load Testing](https://img.shields.io/badge/MLG.clan-Load_Testing-brightgreen?style=for-the-badge&logo=gamepad)

A comprehensive load testing framework designed specifically for the MLG.clan gaming platform, capable of testing 1000+ concurrent users across all gaming workflows including voting, tournaments, clan battles, and Web3 integrations.

## 🎮 Overview

The MLG.clan Load Testing Framework provides end-to-end performance validation for gaming-specific scenarios:

- **🗳️ Burn-to-Vote Mechanics**: Test concurrent voting with MLG token burning
- **⚔️ Clan Battle Coordination**: Real-time clan battle stress testing
- **🏆 Tournament Management**: Tournament bracket and participation load testing
- **📊 Dynamic Leaderboards**: High-frequency leaderboard update testing
- **🔗 Solana Integration**: Web3 transaction throughput and confirmation testing
- **🌐 WebSocket Communications**: Real-time gaming event coordination
- **💾 Database Performance**: Gaming query optimization and connection pooling
- **📈 Real-time Monitoring**: Live performance dashboards during testing

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure load testing tools are available
npm install -g k6 artillery
```

### Basic Usage

```bash
# Run quick smoke test (100 users, 2 minutes)
npm run load:test:quick

# Run gaming scenarios (500 users, 5 minutes)
npm run load:test:gaming

# Run full load test (1000 users, 10 minutes)
npm run load:test:full

# Start performance monitoring dashboard
npm run load:test:monitoring
```

### Advanced Usage

```bash
# Run specific component tests
npm run load:test:k6          # API load testing
npm run load:test:artillery   # WebSocket testing
npm run load:test:solana      # Blockchain testing

# Generate comprehensive report
npm run load:test:report

# Custom configuration
node scripts/load-testing/orchestrator.js --profile=custom --users=1500 --duration=15m
```

## 🏗️ Architecture

```
scripts/load-testing/
├── orchestrator.js              # Main test orchestrator
├── config/
│   └── load-test-config.json   # Test configuration
├── k6/
│   └── gaming-scenarios.js     # K6 API load tests
├── artillery/
│   ├── gaming-flows.yml        # Artillery WebSocket tests
│   └── gaming-processor.js     # Custom gaming logic
├── solana/
│   └── transaction-load-test.js # Solana transaction testing
├── database/
│   └── stress-test.js          # Database stress testing
├── websocket/
│   └── connection-test.js      # WebSocket load testing
├── monitoring/
│   └── performance-monitor.js  # Real-time monitoring
├── reporting/
│   └── generate-report.js      # Comprehensive reporting
└── fixtures/
    └── test-data.json          # Generated test data
```

## 🎯 Testing Scenarios

### 1. Gaming Voting Flow (30% weight)
- **Concurrent Vote Submission**: Users submit burn-to-vote transactions
- **Token Balance Validation**: Real-time token balance checking
- **Vote Result Aggregation**: Live vote count updates
- **Leaderboard Updates**: Dynamic ranking adjustments

**Test Validation:**
- Voting response time < 100ms (P95)
- Token burn success rate > 95%
- Vote integrity maintained under load
- No double-voting scenarios

### 2. Clan Battle Coordination (20% weight)
- **Battle Room Management**: Multiple simultaneous clan battles
- **Real-time Action Processing**: Attack, defend, special actions
- **Battle State Synchronization**: Consistent battle state across users
- **Victory Condition Calculation**: Real-time battle outcome processing

**Test Validation:**
- Battle action latency < 200ms
- State consistency across all participants
- Proper battle result distribution
- Resource allocation accuracy

### 3. Tournament Management (15% weight)
- **Tournament Registration**: High-concurrency user registration
- **Bracket Generation**: Dynamic bracket creation and updates
- **Match Result Processing**: Real-time match outcome handling
- **Prize Distribution**: Automated prize/token distribution

**Test Validation:**
- Registration response time < 500ms
- Bracket accuracy under concurrent updates
- Prize distribution integrity
- Tournament progression validation

### 4. Leaderboard Systems (15% weight)
- **Global Leaderboard Queries**: High-frequency ranking requests
- **Clan Leaderboard Updates**: Concurrent clan ranking updates
- **Score Aggregation**: Real-time score calculation
- **Historical Data Access**: Past performance queries

**Test Validation:**
- Leaderboard refresh < 500ms
- Ranking accuracy during updates
- Historical data consistency
- Cache invalidation effectiveness

### 5. Content Browsing (20% weight)
- **Trending Content**: Popular content discovery
- **Search Functionality**: Content search under load
- **Category Browsing**: Category-based content filtering
- **Recommendation Engine**: Personalized content suggestions

**Test Validation:**
- Content loading time < 300ms
- Search response time < 400ms
- Recommendation accuracy maintained
- Content freshness validation

## 🔧 Configuration

### Test Profiles

The framework includes pre-configured test profiles:

```json
{
  "quick": {
    "users": 100,
    "duration": "2m",
    "scenarios": ["voting", "browsing"]
  },
  "gaming": {
    "users": 500, 
    "duration": "5m",
    "scenarios": ["voting", "clan-battles", "tournaments", "leaderboards"]
  },
  "full": {
    "users": 1000,
    "duration": "10m", 
    "scenarios": ["all"]
  }
}
```

### Environment Configuration

```json
{
  "environments": {
    "local": {
      "baseUrl": "http://localhost:3000",
      "apiUrl": "http://localhost:3000/api",
      "wsUrl": "ws://localhost:3000",
      "solanaRpc": "https://api.devnet.solana.com"
    }
  }
}
```

### Performance Thresholds

```json
{
  "performanceThresholds": {
    "api": {
      "maxResponseTime": 500,
      "minSuccessRate": 95
    },
    "websocket": {
      "minConnectionSuccessRate": 95,
      "maxMessageLatency": 100
    },
    "solana": {
      "minSuccessRate": 95,
      "maxConfirmationTime": 3000
    }
  }
}
```

## 📊 Monitoring & Dashboards

### Real-time Performance Dashboard

Access the live monitoring dashboard during tests:

```
http://localhost:8090/dashboard
```

**Dashboard Features:**
- Real-time gaming metrics (voting latency, token burn rate)
- System resource utilization (CPU, memory, network)
- API response times and error rates
- WebSocket connection health
- Blockchain transaction status
- Active alerts and performance warnings

### Metrics Collected

- **Gaming Metrics**: Voting latency, clan battle response times, tournament updates
- **System Metrics**: CPU, memory, disk, network utilization
- **API Metrics**: Response times, throughput, error rates
- **Database Metrics**: Query performance, connection pool usage, lock contention
- **WebSocket Metrics**: Connection success rates, message latency, disconnections
- **Blockchain Metrics**: Transaction throughput, confirmation times, RPC latency

## 📋 Reporting

### Automated Report Generation

The framework generates comprehensive reports in multiple formats:

```bash
# Generate consolidated report
npm run load:test:report

# Custom report generation
node scripts/load-testing/reporting/generate-report.js --format=html --include-trends
```

### Report Components

1. **Executive Summary**
   - Overall performance grade (A-F)
   - System scalability score
   - Production readiness assessment
   - Critical issues count

2. **Component Analysis**
   - API performance breakdown
   - Database query analysis  
   - WebSocket connection metrics
   - Blockchain transaction analysis

3. **Gaming-Specific Metrics**
   - Vote processing efficiency
   - Clan battle coordination performance
   - Tournament management scalability
   - Leaderboard update frequency

4. **Risk Assessment**
   - System stability evaluation
   - Scalability bottleneck identification
   - Business impact analysis
   - Technical debt assessment

5. **Recommendations**
   - Performance optimization suggestions
   - Scalability improvement plans
   - Infrastructure upgrade recommendations
   - Gaming mechanics optimization

### Sample Report Output

```
🎮 MLG.clan Load Testing Results
================================
🏆 Overall Grade: B
🎯 System Stability: stable
👥 Recommended Max Users: 750
📈 Scalability Score: 82/100
🚦 Production Readiness: ready_with_monitoring
⚠️  Critical Issues: 0

Key Findings:
✅ API performance meets gaming requirements (P95 < 500ms)
✅ Voting system handles 500+ concurrent votes
✅ Clan battles support 10+ simultaneous battles
✅ WebSocket connections stable at 1000+ concurrent
⚠️  Database shows lock contention under peak load
🔧 Solana transaction confirmation averaging 1.8s
```

## 🔍 Performance Validation

### Success Criteria

The framework validates performance against gaming-specific criteria:

**🗳️ Voting System**
- ✅ Vote submission latency < 100ms (P95)
- ✅ Token burn success rate > 95%
- ✅ Vote integrity maintained under concurrent load
- ✅ Leaderboard updates within 1 second

**⚔️ Clan Battles**
- ✅ Battle action response time < 200ms
- ✅ State synchronization across 50+ participants
- ✅ Battle result accuracy under high concurrency
- ✅ Resource allocation correctness

**🏆 Tournaments**
- ✅ Registration handling 100+ concurrent users
- ✅ Bracket generation under 5 seconds
- ✅ Match result processing < 1 second
- ✅ Prize distribution accuracy

**🌐 WebSocket Communications**
- ✅ Connection success rate > 95%
- ✅ Message delivery latency < 100ms
- ✅ Connection stability over test duration
- ✅ Graceful degradation under network issues

## 🛠️ Development & Testing

### Running Individual Components

```bash
# Test specific components
node scripts/load-testing/k6/gaming-scenarios.js
node scripts/load-testing/solana/transaction-load-test.js
node scripts/load-testing/database/stress-test.js
node scripts/load-testing/websocket/connection-test.js
```

### Custom Test Development

Create custom gaming scenarios:

```javascript
// Custom voting scenario
export function customVotingFlow() {
  group('Custom Gaming Voting', function() {
    // Authenticate user
    const auth = authenticateGamer();
    
    // Get trending content  
    const content = getTrendingContent();
    
    // Submit burn-to-vote
    const vote = submitBurnVote(content.id, 25); // 25 tokens
    
    // Validate vote recorded
    const validation = validateVoteRecorded(vote.id);
    
    check(validation, {
      'vote recorded successfully': (r) => r.status === 200,
      'tokens deducted correctly': (r) => r.body.tokensRemaining < auth.initialBalance,
      'leaderboard updated': (r) => r.body.leaderboardPosition > 0
    });
  });
}
```

### Adding New Gaming Scenarios

1. **Define Scenario**: Add scenario configuration to `config/load-test-config.json`
2. **Implement Logic**: Create scenario implementation in appropriate component
3. **Add Validation**: Define performance thresholds and success criteria
4. **Update Reporting**: Include new metrics in reporting system

## 🚨 Troubleshooting

### Common Issues

**High Response Times**
```bash
# Check system resources
npm run load:test:monitoring

# Analyze database performance
node scripts/load-testing/database/stress-test.js --connections=10

# Review API endpoints
npm run load:test:k6
```

**WebSocket Connection Failures**
```bash
# Test WebSocket isolation
node scripts/load-testing/websocket/connection-test.js --connections=100

# Monitor connection health
curl http://localhost:8090/metrics | grep websocket
```

**Solana Transaction Issues**
```bash
# Test Solana connectivity
node scripts/load-testing/solana/transaction-load-test.js --users=10 --duration=1m

# Check RPC endpoint status
curl -X POST https://api.devnet.solana.com -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}'
```

### Performance Debugging

Enable debug logging:

```bash
export DEBUG=mlg:load-test:*
npm run load:test:gaming
```

Monitor system resources:

```bash
# During load test execution
htop
iotop
netstat -an | grep ESTABLISHED | wc -l
```

## 🤝 Contributing

### Adding New Gaming Scenarios

1. Fork the repository
2. Create scenario branch: `git checkout -b feature/clan-tournaments`
3. Implement scenario in appropriate component
4. Add tests and documentation
5. Submit pull request

### Performance Optimization

1. Identify bottlenecks using monitoring data
2. Create optimization branch: `git checkout -b optimize/database-queries`
3. Implement improvements
4. Validate with load tests
5. Document performance gains

## 📖 API Reference

### Orchestrator API

```javascript
import MLGLoadTestOrchestrator from './orchestrator.js';

const orchestrator = new MLGLoadTestOrchestrator({
  profile: 'gaming',
  users: 500,
  duration: '5m'
});

await orchestrator.run();
```

### Performance Monitor API

```javascript
import MLGPerformanceMonitor from './monitoring/performance-monitor.js';

const monitor = new MLGPerformanceMonitor({
  sampleInterval: 1000,
  metricsPort: 8090
});

await monitor.start();
```

### Report Generator API

```javascript
import MLGLoadTestReporter from './reporting/generate-report.js';

const reporter = new MLGLoadTestReporter({
  format: 'both',
  includeCharts: true
});

await reporter.generateConsolidatedReport();
```

## 📄 License

This load testing framework is part of the MLG.clan gaming platform and is licensed under the MIT License.

## 🆘 Support

For questions, issues, or feature requests:

- 📧 Email: dev-team@mlg.clan
- 💬 Discord: [MLG.clan Development](https://discord.gg/mlgclan-dev)
- 📋 Issues: [GitHub Issues](https://github.com/mlg-clan/load-testing/issues)
- 📖 Documentation: [docs.mlg.clan/load-testing](https://docs.mlg.clan/load-testing)

---

**⚡ Built for Gaming Performance at Scale**

*The MLG.clan Load Testing Framework ensures your gaming platform can handle the intensity of competitive gaming at any scale.*