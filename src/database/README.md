# MLG.clan Database Implementation

Comprehensive database architecture for the MLG.clan gaming platform with PostgreSQL and MongoDB integration.

## Overview

This database implementation provides a robust, scalable foundation for the MLG.clan platform, supporting:

- **PostgreSQL**: Primary relational database for core platform data
- **MongoDB**: Real-time data, analytics, chat, and caching
- **Blockchain Integration**: Support for Solana wallet addresses and transactions
- **Gaming Features**: Clans, content voting, achievements, and tournaments
- **Real-time Systems**: Activity feeds, notifications, and chat

## Architecture

### PostgreSQL Schema

The PostgreSQL database handles structured, transactional data:

#### Core Tables

- **users**: User accounts with wallet addresses and authentication
- **user_profiles**: Extended user information and gaming preferences
- **clans**: Gaming clans with token staking and tier system
- **clan_members**: Clan membership and roles
- **content_submissions**: User-generated gaming content
- **voting_transactions**: MLG token burn-to-vote transactions
- **blockchain_transactions**: All Solana transaction records
- **achievements**: Platform achievements and rewards

#### Key Features

- **ENUM Types**: Type-safe status fields (user_status, clan_tier, content_status, etc.)
- **UUID Primary Keys**: Globally unique identifiers for distributed systems
- **JSON Columns**: Flexible metadata storage while maintaining structure
- **Full-Text Search**: Search vectors for content discovery
- **Audit Trails**: Comprehensive logging and moderation tracking
- **Performance Indexes**: Optimized for gaming platform query patterns

### MongoDB Collections

MongoDB handles real-time and analytics data:

#### Core Collections

- **activity_feeds**: Real-time user activity streams
- **notifications**: User notifications and alerts
- **chat_messages**: Clan and direct messaging
- **analytics_events**: User behavior and platform analytics
- **file_metadata**: File processing and storage information
- **user_cache**: Performance optimization cache
- **event_logs**: System audit trails and debugging

#### Key Features

- **Time-Series Optimization**: Efficient storage for analytics and logs
- **Schema Validation**: JSON Schema validation for data integrity
- **TTL Indexes**: Automatic cleanup of expired data
- **Aggregation Pipelines**: Real-time analytics and reporting
- **Horizontal Scaling**: Sharding-ready design

## Installation & Setup

### Prerequisites

- Node.js 18+ with ES modules support
- PostgreSQL 14+ with required extensions
- MongoDB 6.0+ with replica set configuration
- Environment variables configured

### Required PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=mlg_clan
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# PostgreSQL Pool Settings
POSTGRES_POOL_MIN=2
POSTGRES_POOL_MAX=20
POSTGRES_CONNECTION_TIMEOUT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mlg_clan_realtime
MONGO_MIN_POOL_SIZE=5
MONGO_MAX_POOL_SIZE=50

# Application Settings
NODE_ENV=development
TZ=UTC
```

### Database Initialization

1. **Create PostgreSQL Schema**:
```bash
psql -U postgres -d mlg_clan -f src/database/postgresql-schema.sql
```

2. **Initialize MongoDB Collections**:
```javascript
import { DatabaseManager } from './src/database/database-config.js';
const dbManager = new DatabaseManager();
await dbManager.initialize();
```

3. **Load Development Data**:
```bash
psql -U postgres -d mlg_clan -f src/database/seeds/development-seed.sql
```

## Usage

### Basic Connection Management

```javascript
import { DatabaseManager } from './src/database/database-config.js';

// Initialize database connections
const dbManager = new DatabaseManager();
await dbManager.initialize();

// PostgreSQL queries
const users = await dbManager.postgresql.query('SELECT * FROM users LIMIT 10');

// MongoDB operations
const activities = await dbManager.mongodb
  .collection('activity_feeds')
  .find({ userId: 'user-id' })
  .sort({ timestamp: -1 })
  .limit(20)
  .toArray();

// Health check
const health = await dbManager.healthCheck();
console.log('Database Status:', health.status);

// Cleanup
await dbManager.close();
```

### Transaction Management

```javascript
// PostgreSQL transaction
await dbManager.postgresql.transaction(async (client) => {
  await client.query('INSERT INTO users (id, wallet_address) VALUES ($1, $2)', [id, wallet]);
  await client.query('INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)', [id, name]);
});
```

### Migration Management

```javascript
import { MigrationManager } from './src/database/migrations/migration-runner.js';

const migrationManager = new MigrationManager();
await migrationManager.initialize();

// Run pending migrations
await migrationManager.migrate();

// Check migration status
const status = await migrationManager.getStatus();
console.log('Migration Status:', status);
```

## Database Schema Details

### User Management

Users are identified by UUID and linked to Solana wallet addresses:

```sql
-- Create user with wallet verification
INSERT INTO users (id, wallet_address, username, wallet_verified) 
VALUES ('uuid', 'solana-address', 'username', true);

-- User profile with gaming stats
INSERT INTO user_profiles (user_id, display_name, gaming_stats)
VALUES ('user-uuid', 'Display Name', '{"hours_played": 2500, "achievements": 45}');
```

### Clan System

Clans support token staking and tier-based features:

```sql
-- Create clan with token staking
INSERT INTO clans (id, name, tier, staked_tokens, owner_id)
VALUES ('clan-uuid', 'EliteGamers', 'gold', 1000.0, 'owner-uuid');

-- Add clan member
INSERT INTO clan_members (clan_id, user_id, role)
VALUES ('clan-uuid', 'user-uuid', 'member');
```

### Content & Voting

Content submissions support engagement tracking:

```sql
-- Submit gaming content
INSERT INTO content_submissions (id, user_id, title, content_type, game_title)
VALUES ('content-uuid', 'user-uuid', 'Epic Gameplay', 'video', 'Valorant');

-- Vote on content (with MLG token burn tracking)
INSERT INTO content_votes (content_id, user_id, vote_type, voting_transaction_id)
VALUES ('content-uuid', 'voter-uuid', 'upvote', 'transaction-uuid');
```

### Real-time Features (MongoDB)

```javascript
// Activity feed
await db.collection('activity_feeds').insertOne({
  userId: 'user-id',
  activityType: 'content_upload',
  timestamp: new Date(),
  metadata: { contentId: 'content-id', title: 'Epic Play' }
});

// Notifications
await db.collection('notifications').insertOne({
  userId: 'user-id',
  type: 'achievement',
  title: 'Achievement Unlocked!',
  message: 'You earned the "First Vote" achievement',
  isRead: false
});
```

## Performance Considerations

### PostgreSQL Optimization

- **Connection Pooling**: Configured for 2-20 connections based on load
- **Query Optimization**: Indexes on frequently queried columns
- **Partitioning**: Large tables can be partitioned by date/user
- **Read Replicas**: Support for read-only replicas in production

### MongoDB Optimization

- **Indexes**: Comprehensive indexing strategy for all collections
- **Aggregation**: Efficient pipelines for real-time analytics
- **Sharding**: Collections designed with appropriate shard keys
- **TTL**: Automatic cleanup of expired data

### Caching Strategy

- **Application Cache**: MongoDB collections for frequently accessed data
- **Query Cache**: PostgreSQL query result caching
- **Session Cache**: User session data in MongoDB
- **Content Cache**: Computed metrics and aggregations

## Security Features

### Data Protection

- **Encrypted Connections**: TLS/SSL for all database connections
- **Parameter Queries**: Protection against SQL injection
- **Schema Validation**: MongoDB schema validation rules
- **Access Control**: Role-based database permissions

### Blockchain Integration

- **Wallet Verification**: Signature-based wallet ownership proof
- **Transaction Tracking**: Complete audit trail of Solana transactions
- **Token Validation**: MLG token balance verification
- **Anti-Gaming**: Rate limiting and abuse prevention

## Monitoring & Health Checks

### Database Health

```javascript
// Comprehensive health check
const health = await dbManager.healthCheck();
/*
{
  status: 'healthy',
  postgresql: { status: 'healthy', responseTime: 50, activeConnections: 5 },
  mongodb: { status: 'healthy', responseTime: 25, totalDocuments: 10000 },
  summary: { totalConnections: 15, totalQueries: 1000, totalErrors: 0 }
}
*/
```

### Performance Monitoring

- **Query Performance**: Automatic slow query detection
- **Connection Monitoring**: Pool utilization tracking
- **Error Tracking**: Comprehensive error logging
- **Metrics Collection**: Performance metrics in MongoDB

## Testing

### Automated Test Suite

```bash
# Run complete database test suite
node src/database/database-test.js

# Run with specific options
node src/database/database-test.js --cleanup --timeout=10000
```

### Test Coverage

- **Connection Testing**: Database connectivity and pool management
- **Schema Validation**: Table structure and constraint testing
- **CRUD Operations**: Create, read, update, delete functionality
- **Data Integrity**: Foreign key and constraint validation
- **Performance Testing**: Query performance and load testing
- **Migration Testing**: Migration system validation

## Migration System

### Creating Migrations

1. Create migration file: `src/database/migrations/002_add_feature.sql`
2. Include rollback file: `src/database/migrations/002_add_feature_rollback.sql`
3. Run migration: `node src/database/migrations/migration-runner.js migrate`

### Migration Best Practices

- **Sequential Numbering**: Use 001, 002, 003 format
- **Descriptive Names**: Clear description of changes
- **Rollback Support**: Always provide rollback scripts
- **Testing**: Test migrations on copy of production data
- **Backup**: Always backup before running migrations

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Database users and permissions set
- [ ] Backup procedures implemented
- [ ] Monitoring alerts configured
- [ ] Migration system tested
- [ ] Performance benchmarks established

### Scaling Considerations

- **Horizontal Scaling**: MongoDB sharding configuration
- **Read Replicas**: PostgreSQL read replica setup
- **Connection Pooling**: PgBouncer or similar for PostgreSQL
- **Caching Layer**: Redis integration for high-traffic scenarios
- **CDN Integration**: Static asset delivery optimization

## Troubleshooting

### Common Issues

1. **Connection Timeouts**: Check network connectivity and pool settings
2. **Migration Failures**: Verify schema compatibility and rollback if needed
3. **Performance Issues**: Review query plans and index usage
4. **Data Consistency**: Check foreign key constraints and transactions

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development DEBUG=database:* node your-app.js
```

### Health Check Endpoints

Monitor database health via HTTP endpoints:

```javascript
app.get('/health/database', async (req, res) => {
  const health = await dbManager.healthCheck();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

## Contributing

### Database Changes

1. Create migration files for schema changes
2. Update seed data if needed
3. Add/update tests for new functionality
4. Update documentation
5. Test on development environment

### Code Standards

- Use parameterized queries for PostgreSQL
- Implement proper error handling
- Follow naming conventions
- Add comprehensive comments
- Include performance considerations

## Support

For issues and questions:

1. Check troubleshooting section
2. Review error logs and health checks
3. Validate environment configuration
4. Test with isolated examples
5. Create detailed issue reports

---

**Database Version**: 1.0.0  
**Last Updated**: 2025-08-10  
**Compatible with**: MLG.clan Platform v1.0+