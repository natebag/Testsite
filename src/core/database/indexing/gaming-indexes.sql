-- MLG.clan Gaming Platform Database Indexes
-- Optimized indexing strategies for high-performance gaming queries
-- 
-- Performance Focus Areas:
-- - Real-time leaderboards and rankings
-- - Fast voting and tournament queries
-- - Efficient clan member lookups
-- - Optimized content discovery
-- - High-speed user session management
--
-- @author Claude Code - Database Performance Architect
-- @version 1.0.0
-- @created 2025-08-12

-- =====================================================
-- USER PERFORMANCE INDEXES
-- =====================================================

-- Primary user lookup optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet_address_active 
ON users (wallet_address, is_active) 
WHERE is_active = true;

-- User statistics for leaderboards (composite index for sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_leaderboard_stats 
ON users (total_votes_cast DESC, mlg_tokens_earned DESC, clan_id, created_at DESC) 
WHERE is_active = true;

-- User session optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login_active 
ON users (last_login DESC, wallet_address) 
WHERE is_active = true AND last_login > NOW() - INTERVAL '30 days';

-- Username search optimization (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_search 
ON users USING gin (to_tsvector('english', username))
WHERE is_active = true;

-- User achievements lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_achievements_count 
ON users (achievements_count DESC, created_at DESC)
WHERE is_active = true AND achievements_count > 0;

-- =====================================================
-- CLAN PERFORMANCE INDEXES  
-- =====================================================

-- Clan leaderboard optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clans_leaderboard 
ON clans (total_votes DESC, member_count DESC, created_at DESC) 
WHERE is_active = true;

-- Clan member lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clans_members_fast 
ON clan_members (clan_id, user_id, role, joined_at DESC)
WHERE is_active = true;

-- Clan search and discovery
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clans_search 
ON clans USING gin (to_tsvector('english', name || ' ' || COALESCE(description, '')))
WHERE is_active = true AND is_public = true;

-- Clan invitation optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clan_invitations_pending 
ON clan_invitations (clan_id, invited_user_id, status, created_at DESC)
WHERE status = 'pending';

-- =====================================================
-- VOTING PERFORMANCE INDEXES
-- =====================================================

-- Real-time voting results (critical for gaming performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_realtime_results 
ON votes (content_id, vote_type, created_at DESC)
WHERE is_active = true;

-- User voting history (prevent double voting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_content_unique 
ON votes (user_id, content_id, vote_type)
WHERE is_active = true;

-- Vote counting aggregation optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_aggregation 
ON votes (content_id, vote_type) 
INCLUDE (tokens_burned, created_at)
WHERE is_active = true;

-- Recent voting activity for leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_recent_activity 
ON votes (user_id, created_at DESC, tokens_burned DESC)
WHERE is_active = true AND created_at > NOW() - INTERVAL '24 hours';

-- Clan voting performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_clan_activity 
ON votes (clan_id, created_at DESC, vote_type)
WHERE is_active = true AND clan_id IS NOT NULL;

-- =====================================================
-- CONTENT PERFORMANCE INDEXES
-- =====================================================

-- Content discovery and trending
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_trending 
ON content (category, total_votes DESC, created_at DESC, view_count DESC)
WHERE status = 'approved' AND is_active = true;

-- Content by creator optimization  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_creator_performance 
ON content (created_by, created_at DESC, total_votes DESC)
WHERE status = 'approved' AND is_active = true;

-- Content search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_fulltext_search 
ON content USING gin (to_tsvector('english', title || ' ' || COALESCE(description, '')))
WHERE status = 'approved' AND is_active = true;

-- Content moderation queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_moderation_queue 
ON content (status, created_at ASC)
WHERE status IN ('pending', 'flagged');

-- Content performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_performance_metrics 
ON content (total_votes DESC, view_count DESC, engagement_score DESC, created_at DESC)
WHERE status = 'approved' AND is_active = true;

-- =====================================================
-- TRANSACTION PERFORMANCE INDEXES
-- =====================================================

-- User transaction history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_history 
ON transactions (user_id, created_at DESC, transaction_type)
WHERE status = 'completed';

-- Transaction verification and blockchain sync
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_blockchain_sync 
ON transactions (blockchain_hash, status, created_at DESC)
WHERE blockchain_hash IS NOT NULL;

-- Token burn tracking for voting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_vote_burns 
ON transactions (transaction_type, amount, created_at DESC)
WHERE transaction_type = 'vote_burn' AND status = 'completed';

-- Transaction performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_performance_monitoring 
ON transactions (status, created_at DESC)
WHERE created_at > NOW() - INTERVAL '1 hour';

-- =====================================================
-- SESSION AND AUTHENTICATION INDEXES
-- =====================================================

-- Active session lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active 
ON user_sessions (user_id, is_active, last_activity DESC)
WHERE is_active = true;

-- Session cleanup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_cleanup 
ON user_sessions (last_activity, is_active)
WHERE last_activity < NOW() - INTERVAL '7 days';

-- Authentication rate limiting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_attempts_rate_limit 
ON auth_attempts (ip_address, user_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '1 hour';

-- =====================================================
-- GAMING-SPECIFIC PERFORMANCE INDEXES
-- =====================================================

-- Tournament brackets and matches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_active_brackets 
ON tournaments (status, tournament_type, start_date DESC)
WHERE status IN ('upcoming', 'active');

-- Tournament participant lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_participants_lookup 
ON tournament_participants (tournament_id, user_id, clan_id)
WHERE is_active = true;

-- Achievement unlock optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_recent 
ON user_achievements (user_id, unlocked_at DESC, achievement_type)
WHERE unlocked_at > NOW() - INTERVAL '30 days';

-- Rewards distribution tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rewards_distribution 
ON user_rewards (user_id, reward_type, created_at DESC, status)
WHERE status = 'pending';

-- =====================================================
-- ANALYTICS AND REPORTING INDEXES
-- =====================================================

-- Daily active users tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_daily 
ON user_activity_log (date(created_at), user_id)
WHERE created_at > NOW() - INTERVAL '90 days';

-- Content engagement analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_engagement_analytics 
ON content_interactions (content_id, interaction_type, created_at)
WHERE created_at > NOW() - INTERVAL '30 days';

-- Platform growth metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_platform_growth_metrics 
ON users (date(created_at), clan_id)
WHERE created_at > NOW() - INTERVAL '1 year';

-- =====================================================
-- PARTIAL INDEXES FOR HIGH-FREQUENCY QUERIES
-- =====================================================

-- Only active, recent votes (90% of voting queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_active_recent_partial 
ON votes (content_id, user_id, created_at DESC)
WHERE is_active = true AND created_at > NOW() - INTERVAL '7 days';

-- Only premium/VIP users for special features
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_premium_tier_partial 
ON users (user_tier, mlg_tokens_balance DESC, last_login DESC)
WHERE user_tier IN ('premium', 'vip') AND is_active = true;

-- Only public clans for discovery
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clans_public_discovery_partial 
ON clans (member_count DESC, total_votes DESC, created_at DESC)
WHERE is_public = true AND is_active = true AND member_count >= 5;

-- =====================================================
-- EXPRESSION INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- User engagement score calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_engagement_score 
ON users ((total_votes_cast + COALESCE(achievements_count, 0) * 10 + COALESCE(content_created, 0) * 5) DESC)
WHERE is_active = true;

-- Content popularity score (votes + views weighted)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_popularity_score 
ON content ((total_votes * 2 + view_count * 0.1) DESC, created_at DESC)
WHERE status = 'approved' AND is_active = true;

-- Clan activity score
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clans_activity_score 
ON clans ((total_votes + member_count * 10) DESC, created_at DESC)
WHERE is_active = true;

-- =====================================================
-- JSONB INDEXES FOR FLEXIBLE DATA
-- =====================================================

-- User preferences and settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_preferences_gin 
ON users USING gin (preferences)
WHERE preferences IS NOT NULL;

-- Content metadata search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_metadata_gin 
ON content USING gin (metadata)
WHERE metadata IS NOT NULL;

-- Transaction metadata for blockchain integration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_metadata_gin 
ON transactions USING gin (metadata)
WHERE metadata IS NOT NULL;

-- =====================================================
-- COVERING INDEXES FOR READ-HEAVY QUERIES
-- =====================================================

-- User profile summary (includes most accessed fields)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_covering 
ON users (user_id) 
INCLUDE (username, wallet_address, total_votes_cast, mlg_tokens_earned, clan_id, user_tier, last_login)
WHERE is_active = true;

-- Content summary for listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_listing_covering 
ON content (created_at DESC) 
INCLUDE (content_id, title, created_by, total_votes, view_count, category)
WHERE status = 'approved' AND is_active = true;

-- Vote summary for aggregations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_summary_covering 
ON votes (content_id) 
INCLUDE (vote_type, tokens_burned, user_id, created_at)
WHERE is_active = true;

-- =====================================================
-- MAINTENANCE AND MONITORING
-- =====================================================

-- Create function to monitor index usage
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE(
    schemaname TEXT,
    tablename TEXT, 
    indexname TEXT,
    index_size TEXT,
    idx_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::TEXT,
        s.tablename::TEXT,
        s.indexname::TEXT,
        pg_size_pretty(pg_relation_size(s.indexname::regclass))::TEXT as index_size,
        s.idx_scan
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.idx_scan < 100  -- Adjust threshold as needed
        AND NOT i.indisunique  -- Keep unique indexes
        AND s.indexname NOT LIKE 'pk_%'  -- Keep primary keys
    ORDER BY s.idx_scan ASC, pg_relation_size(s.indexname::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get query performance statistics
CREATE OR REPLACE FUNCTION get_query_performance_stats()
RETURNS TABLE(
    query_type TEXT,
    avg_time NUMERIC,
    total_calls BIGINT,
    cache_hit_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN query LIKE '%SELECT%FROM users%' THEN 'User Queries'
            WHEN query LIKE '%SELECT%FROM clans%' THEN 'Clan Queries'  
            WHEN query LIKE '%SELECT%FROM votes%' THEN 'Voting Queries'
            WHEN query LIKE '%SELECT%FROM content%' THEN 'Content Queries'
            ELSE 'Other Queries'
        END::TEXT as query_type,
        ROUND(mean_time::NUMERIC, 2) as avg_time,
        calls as total_calls,
        ROUND(
            (shared_blks_hit::NUMERIC / NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100, 
            2
        ) as cache_hit_ratio
    FROM pg_stat_statements 
    WHERE calls > 100
    ORDER BY mean_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEX MAINTENANCE COMMANDS
-- =====================================================

-- Script to reindex all gaming tables during maintenance window
-- Run these during low-traffic periods

/*
-- Reindex users table
REINDEX TABLE CONCURRENTLY users;

-- Reindex clans table  
REINDEX TABLE CONCURRENTLY clans;

-- Reindex votes table (most critical)
REINDEX TABLE CONCURRENTLY votes;

-- Reindex content table
REINDEX TABLE CONCURRENTLY content;

-- Update table statistics
ANALYZE users;
ANALYZE clans; 
ANALYZE votes;
ANALYZE content;
ANALYZE transactions;
*/

-- =====================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Query to check index effectiveness
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- Query to identify slow queries needing indexes
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
*/

COMMIT;