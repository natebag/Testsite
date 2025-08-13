-- MLG.clan Production Database Optimizations
-- Migration: 010_production_optimizations.sql
-- Description: Production-specific optimizations, indexes, and performance enhancements

-- Create performance indexes for gaming platform
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet_address_hash 
ON users USING hash(wallet_address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_desc 
ON users(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login_desc 
ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- Voting system performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_proposal_id_created_at 
ON votes(proposal_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_id_created_at 
ON votes(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_status_created_at 
ON proposals(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_creator_id_status 
ON proposals(creator_id, status);

-- Clan system performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_members_clan_id_role 
ON clan_members(clan_id, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_members_user_id_active 
ON clan_members(user_id) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clans_created_at_desc 
ON clans(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clans_member_count_desc 
ON clans(member_count DESC);

-- Content system performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_creator_id_created_at 
ON content(creator_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_status_created_at 
ON content(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_category_votes 
ON content(category, vote_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_featured_created_at 
ON content(created_at DESC) WHERE featured = true;

-- Transaction and blockchain indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id_created_at 
ON transactions(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_signature_hash 
ON transactions USING hash(signature);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_created_at 
ON transactions(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blockchain_events_block_timestamp 
ON blockchain_events(block_timestamp DESC);

-- Gaming leaderboard indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_user_id_earned_at 
ON user_achievements(user_id, earned_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_achievement_type_earned_at 
ON user_achievements(achievement_type, earned_at DESC);

-- Session and authentication indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id_active 
ON user_sessions(user_id) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires_at 
ON user_sessions(expires_at) WHERE active = true;

-- Audit and logging indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id_timestamp 
ON audit_logs(user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs(action, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp_desc 
ON audit_logs(timestamp DESC);

-- Performance monitoring tables
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(10,4) NOT NULL,
    metric_unit VARCHAR(20) NOT NULL DEFAULT 'ms',
    category VARCHAR(50) NOT NULL,
    tags JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_metric_name CHECK (length(metric_name) > 0),
    CONSTRAINT valid_metric_value CHECK (metric_value >= 0)
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_recorded_at 
ON performance_metrics(metric_name, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_category_recorded_at 
ON performance_metrics(category, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at_desc 
ON performance_metrics(recorded_at DESC);

-- Create GIN index for JSONB tags
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tags_gin 
ON performance_metrics USING gin(tags);

-- Gaming analytics tables
CREATE TABLE IF NOT EXISTS gaming_analytics (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    clan_id INTEGER REFERENCES clans(id),
    event_data JSONB NOT NULL,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_event_type CHECK (length(event_type) > 0)
);

CREATE INDEX IF NOT EXISTS idx_gaming_analytics_event_type_recorded_at 
ON gaming_analytics(event_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gaming_analytics_user_id_recorded_at 
ON gaming_analytics(user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gaming_analytics_clan_id_recorded_at 
ON gaming_analytics(clan_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gaming_analytics_session_id 
ON gaming_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_gaming_analytics_recorded_at_desc 
ON gaming_analytics(recorded_at DESC);

-- Create GIN index for event data
CREATE INDEX IF NOT EXISTS idx_gaming_analytics_event_data_gin 
ON gaming_analytics USING gin(event_data);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health_checks (
    id SERIAL PRIMARY KEY,
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'healthy',
    response_time_ms INTEGER,
    error_message TEXT,
    details JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'timeout'))
);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_name_checked_at 
ON system_health_checks(check_name, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_status_checked_at 
ON system_health_checks(status, checked_at DESC);

-- Database optimization settings
-- Update table statistics more frequently for better query planning
ALTER TABLE users SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE votes SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE proposals SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE content SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE clans SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE clan_members SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE transactions SET (autovacuum_analyze_scale_factor = 0.02);

-- Set more aggressive autovacuum for high-traffic tables
ALTER TABLE gaming_analytics SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE performance_metrics SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE system_health_checks SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);

-- Partitioning for large tables (future-proofing)
-- Note: This creates partition tables but doesn't migrate existing data
-- That would be done in a separate migration if needed

-- Partition audit_logs by month
CREATE TABLE IF NOT EXISTS audit_logs_template (
    LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Partition gaming_analytics by month  
CREATE TABLE IF NOT EXISTS gaming_analytics_template (
    LIKE gaming_analytics INCLUDING ALL
) PARTITION BY RANGE (recorded_at);

-- Create materialized views for common aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS clan_statistics AS
SELECT 
    c.id,
    c.name,
    c.member_count,
    COUNT(DISTINCT cm.user_id) as active_members,
    COUNT(DISTINCT v.user_id) as voting_members,
    COALESCE(SUM(v.tokens_burned), 0) as total_tokens_burned,
    MAX(cm.joined_at) as last_member_joined,
    AVG(u.gaming_level) as avg_member_level
FROM clans c
LEFT JOIN clan_members cm ON c.id = cm.clan_id AND cm.active = true
LEFT JOIN users u ON cm.user_id = u.id
LEFT JOIN votes v ON u.id = v.user_id
GROUP BY c.id, c.name, c.member_count;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clan_statistics_id 
ON clan_statistics(id);

-- Create materialized view for user leaderboards
CREATE MATERIALIZED VIEW IF NOT EXISTS user_leaderboard AS
SELECT 
    u.id,
    u.username,
    u.wallet_address,
    u.gaming_level,
    COALESCE(SUM(v.tokens_burned), 0) as total_tokens_burned,
    COUNT(v.id) as total_votes,
    COUNT(DISTINCT v.proposal_id) as unique_proposals_voted,
    COUNT(DISTINCT c.id) as content_created,
    COUNT(DISTINCT ua.id) as achievements_earned,
    RANK() OVER (ORDER BY COALESCE(SUM(v.tokens_burned), 0) DESC) as burn_rank,
    RANK() OVER (ORDER BY u.gaming_level DESC) as level_rank,
    u.created_at
FROM users u
LEFT JOIN votes v ON u.id = v.user_id
LEFT JOIN content c ON u.id = c.creator_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
WHERE u.active = true
GROUP BY u.id, u.username, u.wallet_address, u.gaming_level, u.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_leaderboard_id 
ON user_leaderboard(id);

CREATE INDEX IF NOT EXISTS idx_user_leaderboard_burn_rank 
ON user_leaderboard(burn_rank);

CREATE INDEX IF NOT EXISTS idx_user_leaderboard_level_rank 
ON user_leaderboard(level_rank);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_gaming_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY clan_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Gaming-specific stored procedures for performance
CREATE OR REPLACE FUNCTION get_user_gaming_stats(p_user_id INTEGER)
RETURNS TABLE (
    total_votes BIGINT,
    total_tokens_burned NUMERIC,
    unique_proposals BIGINT,
    content_created BIGINT,
    achievements_earned BIGINT,
    clan_role VARCHAR,
    gaming_level INTEGER,
    burn_rank BIGINT,
    level_rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(COUNT(v.id), 0)::BIGINT as total_votes,
        COALESCE(SUM(v.tokens_burned), 0) as total_tokens_burned,
        COALESCE(COUNT(DISTINCT v.proposal_id), 0)::BIGINT as unique_proposals,
        COALESCE(COUNT(DISTINCT c.id), 0)::BIGINT as content_created,
        COALESCE(COUNT(DISTINCT ua.id), 0)::BIGINT as achievements_earned,
        COALESCE(cm.role, 'none') as clan_role,
        u.gaming_level,
        ul.burn_rank,
        ul.level_rank
    FROM users u
    LEFT JOIN votes v ON u.id = v.user_id
    LEFT JOIN content c ON u.id = c.creator_id AND c.status = 'approved'
    LEFT JOIN user_achievements ua ON u.id = ua.user_id
    LEFT JOIN clan_members cm ON u.id = cm.user_id AND cm.active = true
    LEFT JOIN user_leaderboard ul ON u.id = ul.id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.gaming_level, cm.role, ul.burn_rank, ul.level_rank;
END;
$$ LANGUAGE plpgsql;

-- Function to get clan leaderboard
CREATE OR REPLACE FUNCTION get_clan_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    clan_id INTEGER,
    clan_name VARCHAR,
    member_count INTEGER,
    total_tokens_burned NUMERIC,
    total_votes BIGINT,
    avg_member_level NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.member_count,
        cs.total_tokens_burned,
        COALESCE(COUNT(v.id), 0)::BIGINT as total_votes,
        cs.avg_member_level,
        c.created_at
    FROM clans c
    LEFT JOIN clan_statistics cs ON c.id = cs.id
    LEFT JOIN clan_members cm ON c.id = cm.clan_id AND cm.active = true
    LEFT JOIN votes v ON cm.user_id = v.user_id
    GROUP BY c.id, c.name, c.member_count, cs.total_tokens_burned, cs.avg_member_level, c.created_at
    ORDER BY cs.total_tokens_burned DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic statistics updates
CREATE OR REPLACE FUNCTION update_clan_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE clans 
        SET member_count = member_count + 1 
        WHERE id = NEW.clan_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE clans 
        SET member_count = member_count - 1 
        WHERE id = OLD.clan_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.active = true AND NEW.active = false THEN
            UPDATE clans 
            SET member_count = member_count - 1 
            WHERE id = OLD.clan_id;
        ELSIF OLD.active = false AND NEW.active = true THEN
            UPDATE clans 
            SET member_count = member_count + 1 
            WHERE id = NEW.clan_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trg_update_clan_member_count ON clan_members;
CREATE TRIGGER trg_update_clan_member_count
    AFTER INSERT OR UPDATE OR DELETE ON clan_members
    FOR EACH ROW EXECUTE FUNCTION update_clan_member_count();

-- Create function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM gaming_analytics 
    WHERE recorded_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM performance_metrics 
    WHERE recorded_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE votes;
ANALYZE proposals;
ANALYZE content;
ANALYZE clans;
ANALYZE clan_members;
ANALYZE transactions;

-- Log successful completion
INSERT INTO migration_history (
    migration_name,
    checksum,
    executed_at,
    execution_time_ms,
    rollback_sql,
    status,
    git_commit,
    environment,
    executed_by
) VALUES (
    '010_production_optimizations',
    'production_optimization_v1',
    NOW(),
    0,
    '-- Rollback would require dropping indexes and tables created in this migration',
    'completed',
    COALESCE(current_setting('app.git_commit', true), 'unknown'),
    COALESCE(current_setting('app.environment', true), 'production'),
    COALESCE(current_setting('app.executed_by', true), 'system')
) ON CONFLICT (migration_name) DO NOTHING;