-- MLG.clan Platform Performance Optimization Migration
-- 
-- This migration implements comprehensive performance improvements including:
-- - Materialized views for real-time leaderboards
-- - Partitioning for high-volume tables
-- - Performance-focused table modifications
-- - Trigger optimizations
-- - Statistical views and functions
-- 
-- @author Claude Code - Database Performance Architect
-- @version 1.0.0
-- @created 2025-08-12
-- @migration_id 20250812_performance_optimization

BEGIN;

-- =====================================================
-- PERFORMANCE CONFIGURATION
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Update PostgreSQL settings for gaming workload
-- (These would typically be set in postgresql.conf)
/*
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET effective_cache_size = '4GB';
ALTER SYSTEM SET random_page_cost = 1.1;
*/

-- =====================================================
-- MATERIALIZED VIEWS FOR LEADERBOARDS
-- =====================================================

-- Real-time user leaderboard (updated every 30 seconds)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_leaderboard AS
SELECT 
    u.user_id,
    u.username,
    u.wallet_address,
    u.clan_id,
    c.name as clan_name,
    u.total_votes_cast,
    u.mlg_tokens_earned,
    u.mlg_tokens_balance,
    u.achievements_count,
    -- Calculated engagement score
    (u.total_votes_cast * 2 + 
     COALESCE(u.achievements_count, 0) * 10 + 
     COALESCE(content_created.count, 0) * 5) as engagement_score,
    -- Recent activity score (last 7 days)
    COALESCE(recent_activity.recent_votes, 0) as recent_votes,
    COALESCE(recent_activity.recent_tokens, 0) as recent_tokens,
    u.created_at,
    u.last_login,
    RANK() OVER (ORDER BY u.total_votes_cast DESC) as votes_rank,
    RANK() OVER (ORDER BY u.mlg_tokens_earned DESC) as tokens_rank,
    RANK() OVER (ORDER BY 
        u.total_votes_cast * 2 + 
        COALESCE(u.achievements_count, 0) * 10 + 
        COALESCE(content_created.count, 0) * 5 DESC
    ) as engagement_rank
FROM users u
LEFT JOIN clans c ON u.clan_id = c.clan_id
LEFT JOIN (
    SELECT 
        created_by,
        COUNT(*) as count
    FROM content 
    WHERE status = 'approved' 
        AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY created_by
) content_created ON u.user_id = content_created.created_by
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as recent_votes,
        SUM(tokens_burned) as recent_tokens
    FROM votes 
    WHERE created_at > NOW() - INTERVAL '7 days'
        AND is_active = true
    GROUP BY user_id
) recent_activity ON u.user_id = recent_activity.user_id
WHERE u.is_active = true
ORDER BY engagement_score DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_user_leaderboard_user_id 
ON mv_user_leaderboard (user_id);

-- Additional indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_user_leaderboard_votes_rank 
ON mv_user_leaderboard (votes_rank);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_user_leaderboard_engagement_rank 
ON mv_user_leaderboard (engagement_rank);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_user_leaderboard_clan 
ON mv_user_leaderboard (clan_id, engagement_rank);

-- Clan leaderboard materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_clan_leaderboard AS
SELECT 
    c.clan_id,
    c.name,
    c.description,
    c.member_count,
    c.total_votes,
    c.created_at,
    -- Aggregate member statistics
    COALESCE(member_stats.total_member_votes, 0) as total_member_votes,
    COALESCE(member_stats.total_member_tokens, 0) as total_member_tokens,
    COALESCE(member_stats.avg_member_engagement, 0) as avg_member_engagement,
    COALESCE(member_stats.active_members_7d, 0) as active_members_7d,
    COALESCE(member_stats.active_members_30d, 0) as active_members_30d,
    -- Recent activity
    COALESCE(recent_activity.votes_7d, 0) as votes_7d,
    COALESCE(recent_activity.votes_30d, 0) as votes_30d,
    -- Calculated clan score
    (COALESCE(member_stats.total_member_votes, 0) * 0.4 +
     c.member_count * 10 +
     COALESCE(recent_activity.votes_7d, 0) * 2) as clan_score,
    RANK() OVER (ORDER BY c.total_votes DESC) as votes_rank,
    RANK() OVER (ORDER BY c.member_count DESC) as members_rank,
    RANK() OVER (ORDER BY 
        COALESCE(member_stats.total_member_votes, 0) * 0.4 +
        c.member_count * 10 +
        COALESCE(recent_activity.votes_7d, 0) * 2 DESC
    ) as overall_rank
FROM clans c
LEFT JOIN (
    SELECT 
        u.clan_id,
        COUNT(*) as member_count,
        SUM(u.total_votes_cast) as total_member_votes,
        SUM(u.mlg_tokens_earned) as total_member_tokens,
        AVG(u.total_votes_cast * 2 + COALESCE(u.achievements_count, 0) * 10) as avg_member_engagement,
        COUNT(*) FILTER (WHERE u.last_login > NOW() - INTERVAL '7 days') as active_members_7d,
        COUNT(*) FILTER (WHERE u.last_login > NOW() - INTERVAL '30 days') as active_members_30d
    FROM users u
    WHERE u.is_active = true
    GROUP BY u.clan_id
) member_stats ON c.clan_id = member_stats.clan_id
LEFT JOIN (
    SELECT 
        u.clan_id,
        COUNT(*) FILTER (WHERE v.created_at > NOW() - INTERVAL '7 days') as votes_7d,
        COUNT(*) FILTER (WHERE v.created_at > NOW() - INTERVAL '30 days') as votes_30d
    FROM votes v
    JOIN users u ON v.user_id = u.user_id
    WHERE v.is_active = true
    GROUP BY u.clan_id
) recent_activity ON c.clan_id = recent_activity.clan_id
WHERE c.is_active = true
ORDER BY clan_score DESC;

-- Create indexes for clan leaderboard
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_clan_leaderboard_clan_id 
ON mv_clan_leaderboard (clan_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_clan_leaderboard_overall_rank 
ON mv_clan_leaderboard (overall_rank);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_clan_leaderboard_clan_score 
ON mv_clan_leaderboard (clan_score DESC);

-- Content trending materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trending_content AS
SELECT 
    co.content_id,
    co.title,
    co.category,
    co.created_by,
    u.username as creator_username,
    co.total_votes,
    co.view_count,
    co.created_at,
    -- Time-weighted score for trending
    (co.total_votes * 
     CASE 
        WHEN co.created_at > NOW() - INTERVAL '1 day' THEN 10
        WHEN co.created_at > NOW() - INTERVAL '3 days' THEN 5
        WHEN co.created_at > NOW() - INTERVAL '7 days' THEN 2
        ELSE 1
     END +
     co.view_count * 0.1) as trending_score,
    -- Recent engagement
    COALESCE(recent_votes.votes_24h, 0) as votes_24h,
    COALESCE(recent_votes.votes_7d, 0) as votes_7d,
    COALESCE(recent_votes.unique_voters_7d, 0) as unique_voters_7d,
    RANK() OVER (
        PARTITION BY co.category 
        ORDER BY 
            co.total_votes * 
            CASE 
                WHEN co.created_at > NOW() - INTERVAL '1 day' THEN 10
                WHEN co.created_at > NOW() - INTERVAL '3 days' THEN 5
                WHEN co.created_at > NOW() - INTERVAL '7 days' THEN 2
                ELSE 1
            END +
            co.view_count * 0.1 DESC
    ) as category_rank,
    RANK() OVER (
        ORDER BY 
            co.total_votes * 
            CASE 
                WHEN co.created_at > NOW() - INTERVAL '1 day' THEN 10
                WHEN co.created_at > NOW() - INTERVAL '3 days' THEN 5
                WHEN co.created_at > NOW() - INTERVAL '7 days' THEN 2
                ELSE 1
            END +
            co.view_count * 0.1 DESC
    ) as overall_rank
FROM content co
JOIN users u ON co.created_by = u.user_id
LEFT JOIN (
    SELECT 
        content_id,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as votes_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as votes_7d,
        COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as unique_voters_7d
    FROM votes
    WHERE is_active = true
    GROUP BY content_id
) recent_votes ON co.content_id = recent_votes.content_id
WHERE co.status = 'approved' 
    AND co.is_active = true
    AND co.created_at > NOW() - INTERVAL '30 days'
ORDER BY trending_score DESC;

-- Create indexes for trending content
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_trending_content_content_id 
ON mv_trending_content (content_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_trending_content_overall_rank 
ON mv_trending_content (overall_rank);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_trending_content_category_rank 
ON mv_trending_content (category, category_rank);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_trending_content_trending_score 
ON mv_trending_content (trending_score DESC);

-- =====================================================
-- TABLE PARTITIONING FOR HIGH-VOLUME DATA
-- =====================================================

-- Partition votes table by date (monthly partitions)
-- First, check if votes table exists and has data
DO $$
BEGIN
    -- Create partitioned votes table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes_partitioned') THEN
        
        -- Create new partitioned table
        CREATE TABLE votes_partitioned (
            vote_id SERIAL,
            user_id INTEGER NOT NULL,
            content_id INTEGER NOT NULL,
            clan_id INTEGER,
            vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('upvote', 'downvote', 'super_vote')),
            tokens_burned DECIMAL(18,8) NOT NULL DEFAULT 0,
            blockchain_hash VARCHAR(128),
            metadata JSONB,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            PRIMARY KEY (vote_id, created_at)
        ) PARTITION BY RANGE (created_at);
        
        -- Create monthly partitions for current year
        FOR i IN 1..12 LOOP
            EXECUTE format(
                'CREATE TABLE IF NOT EXISTS votes_y2025_m%s PARTITION OF votes_partitioned 
                FOR VALUES FROM (%L) TO (%L)',
                LPAD(i::text, 2, '0'),
                DATE(format('2025-%s-01', i)),
                DATE(format('2025-%s-01', i + 1))
            );
        END LOOP;
        
        -- Create default partition for future dates
        CREATE TABLE IF NOT EXISTS votes_default PARTITION OF votes_partitioned DEFAULT;
        
        -- Create indexes on partitioned table
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_partitioned_user_content 
        ON votes_partitioned (user_id, content_id, created_at DESC);
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_partitioned_content_type 
        ON votes_partitioned (content_id, vote_type, created_at DESC);
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_partitioned_clan_activity 
        ON votes_partitioned (clan_id, created_at DESC) WHERE clan_id IS NOT NULL;
        
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_partitioned_blockchain 
        ON votes_partitioned (blockchain_hash) WHERE blockchain_hash IS NOT NULL;
    END IF;
END$$;

-- Partition user_activity_logs by date (daily partitions for recent data)
CREATE TABLE IF NOT EXISTS user_activity_logs_partitioned (
    activity_id SERIAL,
    user_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (activity_id, created_at)
) PARTITION BY RANGE (created_at);

-- Create daily partitions for last 30 days and next 30 days
DO $$
BEGIN
    FOR i IN -30..30 LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS user_activity_logs_%s PARTITION OF user_activity_logs_partitioned 
            FOR VALUES FROM (%L) TO (%L)',
            to_char(CURRENT_DATE + i, 'YYYY_MM_DD'),
            CURRENT_DATE + i,
            CURRENT_DATE + i + 1
        );
    END LOOP;
END$$;

-- Create indexes on activity logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_partitioned_user 
ON user_activity_logs_partitioned (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_partitioned_type 
ON user_activity_logs_partitioned (activity_type, created_at DESC);

-- =====================================================
-- OPTIMIZED AGGREGATE TABLES
-- =====================================================

-- Daily statistics aggregation table
CREATE TABLE IF NOT EXISTS daily_statistics (
    stat_date DATE NOT NULL PRIMARY KEY,
    total_users INTEGER DEFAULT 0,
    active_users_1d INTEGER DEFAULT 0,
    active_users_7d INTEGER DEFAULT 0,
    active_users_30d INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    total_content INTEGER DEFAULT 0,
    total_clans INTEGER DEFAULT 0,
    tokens_burned DECIMAL(18,8) DEFAULT 0,
    avg_session_duration DECIMAL(10,2) DEFAULT 0,
    unique_content_creators INTEGER DEFAULT 0,
    avg_votes_per_user DECIMAL(10,2) DEFAULT 0,
    top_content_category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on daily statistics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_statistics_date 
ON daily_statistics (stat_date DESC);

-- Hourly statistics for real-time monitoring
CREATE TABLE IF NOT EXISTS hourly_statistics (
    stat_hour TIMESTAMP WITH TIME ZONE NOT NULL PRIMARY KEY,
    active_users INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    total_api_requests INTEGER DEFAULT 0,
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0,
    cache_hit_rate DECIMAL(5,2) DEFAULT 0,
    top_endpoint VARCHAR(255),
    concurrent_users INTEGER DEFAULT 0,
    tokens_burned_hourly DECIMAL(18,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on hourly statistics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hourly_statistics_hour 
ON hourly_statistics (stat_hour DESC);

-- =====================================================
-- PERFORMANCE-FOCUSED FUNCTIONS
-- =====================================================

-- Function to get user leaderboard position efficiently
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(target_user_id INTEGER)
RETURNS TABLE(
    votes_position INTEGER,
    tokens_position INTEGER,
    engagement_position INTEGER,
    total_users INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY total_votes_cast DESC) as votes_rank,
            ROW_NUMBER() OVER (ORDER BY mlg_tokens_earned DESC) as tokens_rank,
            ROW_NUMBER() OVER (ORDER BY 
                total_votes_cast * 2 + 
                COALESCE(achievements_count, 0) * 10 DESC
            ) as engagement_rank
        FROM users 
        WHERE is_active = true
    ),
    user_stats AS (
        SELECT 
            votes_rank::INTEGER as votes_position,
            tokens_rank::INTEGER as tokens_position,
            engagement_rank::INTEGER as engagement_position
        FROM ranked_users 
        WHERE user_id = target_user_id
    ),
    total_count AS (
        SELECT COUNT(*)::INTEGER as total_users FROM users WHERE is_active = true
    )
    SELECT 
        user_stats.votes_position,
        user_stats.tokens_position,
        user_stats.engagement_position,
        total_count.total_users
    FROM user_stats, total_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get clan statistics efficiently
CREATE OR REPLACE FUNCTION get_clan_statistics(target_clan_id INTEGER)
RETURNS TABLE(
    clan_id INTEGER,
    member_count INTEGER,
    total_votes INTEGER,
    avg_member_engagement DECIMAL,
    leaderboard_position INTEGER,
    recent_activity_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH clan_stats AS (
        SELECT 
            c.clan_id,
            c.member_count,
            c.total_votes,
            AVG(u.total_votes_cast * 2 + COALESCE(u.achievements_count, 0) * 10) as avg_member_engagement,
            COUNT(*) FILTER (WHERE v.created_at > NOW() - INTERVAL '7 days') as recent_votes
        FROM clans c
        LEFT JOIN users u ON c.clan_id = u.clan_id AND u.is_active = true
        LEFT JOIN votes v ON u.user_id = v.user_id AND v.is_active = true
        WHERE c.clan_id = target_clan_id AND c.is_active = true
        GROUP BY c.clan_id, c.member_count, c.total_votes
    ),
    clan_ranking AS (
        SELECT 
            clan_id,
            ROW_NUMBER() OVER (ORDER BY total_votes DESC) as position
        FROM clans 
        WHERE is_active = true
    )
    SELECT 
        cs.clan_id::INTEGER,
        cs.member_count::INTEGER,
        cs.total_votes::INTEGER,
        COALESCE(cs.avg_member_engagement, 0)::DECIMAL,
        COALESCE(cr.position, 0)::INTEGER as leaderboard_position,
        COALESCE(cs.recent_votes, 0)::INTEGER as recent_activity_score
    FROM clan_stats cs
    LEFT JOIN clan_ranking cr ON cs.clan_id = cr.clan_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for efficient vote aggregation
CREATE OR REPLACE FUNCTION get_content_vote_summary(target_content_id INTEGER)
RETURNS TABLE(
    content_id INTEGER,
    upvotes INTEGER,
    downvotes INTEGER,
    super_votes INTEGER,
    total_tokens_burned DECIMAL,
    unique_voters INTEGER,
    recent_votes_24h INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        target_content_id::INTEGER,
        COUNT(*) FILTER (WHERE vote_type = 'upvote')::INTEGER as upvotes,
        COUNT(*) FILTER (WHERE vote_type = 'downvote')::INTEGER as downvotes,
        COUNT(*) FILTER (WHERE vote_type = 'super_vote')::INTEGER as super_votes,
        COALESCE(SUM(tokens_burned), 0)::DECIMAL as total_tokens_burned,
        COUNT(DISTINCT user_id)::INTEGER as unique_voters,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::INTEGER as recent_votes_24h
    FROM votes 
    WHERE content_id = target_content_id 
        AND is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- TRIGGERS FOR REAL-TIME STATISTICS
-- =====================================================

-- Function to update user statistics on vote
CREATE OR REPLACE FUNCTION update_user_stats_on_vote()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update user vote count and tokens
        UPDATE users 
        SET 
            total_votes_cast = total_votes_cast + 1,
            mlg_tokens_balance = mlg_tokens_balance - NEW.tokens_burned,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Update content vote count
        UPDATE content 
        SET 
            total_votes = total_votes + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE -1 END,
            updated_at = NOW()
        WHERE content_id = NEW.content_id;
        
        -- Update clan statistics if user is in a clan
        IF NEW.clan_id IS NOT NULL THEN
            UPDATE clans 
            SET 
                total_votes = total_votes + 1,
                updated_at = NOW()
            WHERE clan_id = NEW.clan_id;
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle vote updates (e.g., changing vote type)
        IF OLD.vote_type != NEW.vote_type THEN
            UPDATE content 
            SET 
                total_votes = total_votes + 
                    CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE -1 END - 
                    CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE -1 END,
                updated_at = NOW()
            WHERE content_id = NEW.content_id;
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Update statistics on vote deletion
        UPDATE users 
        SET 
            total_votes_cast = total_votes_cast - 1,
            mlg_tokens_balance = mlg_tokens_balance + OLD.tokens_burned,
            updated_at = NOW()
        WHERE user_id = OLD.user_id;
        
        UPDATE content 
        SET 
            total_votes = total_votes - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE -1 END,
            updated_at = NOW()
        WHERE content_id = OLD.content_id;
        
        IF OLD.clan_id IS NOT NULL THEN
            UPDATE clans 
            SET 
                total_votes = total_votes - 1,
                updated_at = NOW()
            WHERE clan_id = OLD.clan_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote statistics updates
DROP TRIGGER IF EXISTS trg_update_stats_on_vote ON votes;
CREATE TRIGGER trg_update_stats_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_on_vote();

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_leaderboard_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_leaderboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_clan_leaderboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_content;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATED MAINTENANCE PROCEDURES
-- =====================================================

-- Function to generate daily statistics
CREATE OR REPLACE FUNCTION generate_daily_statistics(stat_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void AS $$
BEGIN
    INSERT INTO daily_statistics (
        stat_date,
        total_users,
        active_users_1d,
        active_users_7d,
        active_users_30d,
        new_users,
        total_votes,
        total_content,
        total_clans,
        tokens_burned,
        avg_session_duration,
        unique_content_creators,
        avg_votes_per_user,
        top_content_category
    )
    SELECT 
        stat_date,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs_partitioned 
         WHERE created_at::date = stat_date) as active_users_1d,
        (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs_partitioned 
         WHERE created_at::date >= stat_date - INTERVAL '6 days' 
         AND created_at::date <= stat_date) as active_users_7d,
        (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs_partitioned 
         WHERE created_at::date >= stat_date - INTERVAL '29 days' 
         AND created_at::date <= stat_date) as active_users_30d,
        (SELECT COUNT(*) FROM users 
         WHERE created_at::date = stat_date) as new_users,
        (SELECT COUNT(*) FROM votes 
         WHERE created_at::date = stat_date AND is_active = true) as total_votes,
        (SELECT COUNT(*) FROM content 
         WHERE created_at::date = stat_date AND status = 'approved') as total_content,
        (SELECT COUNT(*) FROM clans WHERE is_active = true) as total_clans,
        (SELECT COALESCE(SUM(tokens_burned), 0) FROM votes 
         WHERE created_at::date = stat_date AND is_active = true) as tokens_burned,
        0 as avg_session_duration, -- Would be calculated from session data
        (SELECT COUNT(DISTINCT created_by) FROM content 
         WHERE created_at::date = stat_date AND status = 'approved') as unique_content_creators,
        (SELECT AVG(total_votes_cast) FROM users WHERE is_active = true) as avg_votes_per_user,
        (SELECT category FROM content 
         WHERE created_at::date = stat_date AND status = 'approved'
         GROUP BY category 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as top_content_category
    ON CONFLICT (stat_date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        active_users_1d = EXCLUDED.active_users_1d,
        active_users_7d = EXCLUDED.active_users_7d,
        active_users_30d = EXCLUDED.active_users_30d,
        new_users = EXCLUDED.new_users,
        total_votes = EXCLUDED.total_votes,
        total_content = EXCLUDED.total_content,
        total_clans = EXCLUDED.total_clans,
        tokens_burned = EXCLUDED.tokens_burned,
        avg_session_duration = EXCLUDED.avg_session_duration,
        unique_content_creators = EXCLUDED.unique_content_creators,
        avg_votes_per_user = EXCLUDED.avg_votes_per_user,
        top_content_category = EXCLUDED.top_content_category,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function for automated partition management
CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
BEGIN
    -- Create future partitions for votes (next 3 months)
    FOR i IN 1..3 LOOP
        partition_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month' * i);
        partition_name := 'votes_y' || EXTRACT(YEAR FROM partition_date) || 
                         '_m' || LPAD(EXTRACT(MONTH FROM partition_date)::text, 2, '0');
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF votes_partitioned 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            partition_date,
            partition_date + INTERVAL '1 month'
        );
    END LOOP;
    
    -- Create future daily partitions for activity logs (next 30 days)
    FOR i IN 1..30 LOOP
        partition_date := CURRENT_DATE + i;
        partition_name := 'user_activity_logs_' || to_char(partition_date, 'YYYY_MM_DD');
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF user_activity_logs_partitioned 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            partition_date,
            partition_date + INTERVAL '1 day'
        );
    END LOOP;
    
    -- Drop old partitions (older than 1 year)
    FOR partition_name IN 
        SELECT schemaname||'.'||tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'votes_y%' 
        AND tablename < 'votes_y' || EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 year')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || partition_name;
    END LOOP;
    
    -- Drop old activity log partitions (older than 90 days)
    FOR partition_name IN 
        SELECT schemaname||'.'||tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'user_activity_logs_%' 
        AND tablename < 'user_activity_logs_' || to_char(CURRENT_DATE - INTERVAL '90 days', 'YYYY_MM_DD')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || partition_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE MONITORING VIEWS
-- =====================================================

-- View for query performance monitoring
CREATE OR REPLACE VIEW v_query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent,
    CASE 
        WHEN query LIKE '%votes%' THEN 'voting'
        WHEN query LIKE '%leaderboard%' OR query LIKE '%rank%' THEN 'leaderboard'
        WHEN query LIKE '%users%' THEN 'user'
        WHEN query LIKE '%clans%' THEN 'clan'
        WHEN query LIKE '%content%' THEN 'content'
        ELSE 'other'
    END as query_category
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC;

-- View for index usage statistics
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
    CASE 
        WHEN idx_scan = 0 THEN 'Never Used'
        WHEN idx_scan < 100 THEN 'Rarely Used'
        WHEN idx_scan < 1000 THEN 'Moderately Used'
        ELSE 'Heavily Used'
    END as usage_category
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- View for table statistics
CREATE OR REPLACE VIEW v_table_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    ROUND(n_dead_tup::numeric / GREATEST(n_live_tup, 1) * 100, 2) as dead_tuple_percent,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- FINAL OPTIMIZATIONS
-- =====================================================

-- Update table statistics
ANALYZE users;
ANALYZE clans;
ANALYZE votes;
ANALYZE content;
ANALYZE transactions;

-- Refresh materialized views for the first time
SELECT refresh_leaderboard_views();

-- Generate initial daily statistics
SELECT generate_daily_statistics(CURRENT_DATE - 1);

-- Set up initial partition maintenance
SELECT maintain_partitions();

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================

/*
Post-migration tasks to be scheduled:

1. Set up cron jobs for automated maintenance:
   - Refresh materialized views every 30 seconds: 
     SELECT refresh_leaderboard_views();
   
   - Generate daily statistics at midnight:
     SELECT generate_daily_statistics();
   
   - Maintain partitions weekly:
     SELECT maintain_partitions();

2. Monitor query performance:
   - Check v_query_performance regularly
   - Identify slow queries and optimize
   - Monitor index usage with v_index_usage

3. Database maintenance:
   - Regular VACUUM and ANALYZE
   - Monitor dead tuple percentages
   - Archive old partition data

4. Performance monitoring:
   - Set up alerts for slow queries
   - Monitor materialized view refresh times
   - Track cache hit ratios and optimize

5. Gaming-specific optimizations:
   - Monitor voting query performance (should be <100ms)
   - Ensure leaderboard updates are <500ms
   - Track real-time user engagement metrics
*/