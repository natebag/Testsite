-- MLG.clan Development Seed Data
-- Creates sample data for development and testing purposes
-- Version: 1.0.0
-- Created: 2025-08-10

-- Note: This seed data is for development only
-- Do not run in production environment

BEGIN;

-- Ensure we're in development mode (safety check)
DO $$
BEGIN
    IF current_setting('server_version_num')::int >= 140000 AND 
       current_setting('application_name', true) NOT LIKE '%dev%' AND
       current_setting('application_name', true) NOT LIKE '%test%' THEN
        RAISE EXCEPTION 'Seed data should only be loaded in development/test environments';
    END IF;
END $$;

-- Clear existing data in correct order (respecting foreign keys)
DELETE FROM user_sessions;
DELETE FROM achievement_progress;
DELETE FROM content_moderation_logs;
DELETE FROM content_votes;
DELETE FROM content_submissions;
DELETE FROM voting_transactions;
DELETE FROM blockchain_transactions;
DELETE FROM voting_proposals;
DELETE FROM clan_invitations;
DELETE FROM clan_members;
DELETE FROM clans;
DELETE FROM user_profiles;
DELETE FROM users;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Insert sample users with realistic gaming profiles
INSERT INTO users (id, wallet_address, username, email, status, wallet_verified, reputation_score, total_votes_cast, total_mlg_burned, total_content_submitted, total_content_approved, created_at) VALUES
('01234567-89ab-cdef-0123-456789abcdef', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'GamerAlpha', 'alpha@mlg.clan', 'active', true, 1250, 45, 25.5, 12, 10, NOW() - INTERVAL '3 months'),
('11234567-89ab-cdef-0123-456789abcdef', 'AaK8t2wKmhgJt5xZmhJk9uERAz7DsGYdLVL9zYtBWWN', 'ProShooter', 'shooter@mlg.clan', 'active', true, 2100, 78, 45.25, 18, 16, NOW() - INTERVAL '6 months'),
('21234567-89ab-cdef-0123-456789abcdef', 'BbL9u3xLnihKu6yAnhKl0vFSBa8EtHZeLWM0AZuCXXO', 'StreamQueen', 'queen@mlg.clan', 'active', true, 3500, 120, 89.75, 35, 32, NOW() - INTERVAL '1 year'),
('31234567-89ab-cdef-0123-456789abcdef', 'CcM0v4yMojhLv7zBoiLm1wGTCb9FuIaFmXN1BAvDYYP', 'ClanLeader', 'leader@mlg.clan', 'active', true, 4200, 150, 125.0, 28, 25, NOW() - INTERVAL '2 years'),
('41234567-89ab-cdef-0123-456789abcdef', 'DdN1w5zNpkiMw8aCpjMn2xHUDc0GvJbGnYO2CBwEZZQ', 'NewbieFriend', 'newbie@mlg.clan', 'active', true, 300, 15, 5.0, 3, 2, NOW() - INTERVAL '1 month'),
('51234567-89ab-cdef-0123-456789abcdef', 'EeO2x6aOqlJnx9bDqkNo3yIVEd1HwKcHoZP3DCxFAAR', 'ContentKing', 'king@mlg.clan', 'active', true, 5000, 200, 175.5, 55, 50, NOW() - INTERVAL '3 years'),
('61234567-89ab-cdef-0123-456789abcdef', 'FfP3y7bPrmKoy0cErlOp4zJWFe2IxLdIpAQ4EDyGBBS', 'ModeratorMike', 'mike@mlg.clan', 'active', true, 2800, 95, 65.25, 20, 18, NOW() - INTERVAL '1.5 years'),
('71234567-89ab-cdef-0123-456789abcdef', 'GgQ4z8cQsnLpz1dFsmPq5aKXGf3JyMeJqBR5FEzHCCT', 'TournamentPro', 'pro@mlg.clan', 'active', true, 6500, 300, 250.0, 42, 40, NOW() - INTERVAL '4 years'),
('81234567-89ab-cdef-0123-456789abcdef', 'HhR5A9dRtoMqA2eGtnQr6bLYHg4KzNfKrCS6GF0IDDU', 'CasualGamer', 'casual@mlg.clan', 'active', true, 800, 35, 15.75, 8, 6, NOW() - INTERVAL '6 months'),
('91234567-89ab-cdef-0123-456789abcdef', 'IiS6B0eSUpNrB3fHuoRs7cMZIh5L0OgLsDT7HG1JEEV', 'AchievementHunter', 'hunter@mlg.clan', 'active', true, 3200, 180, 95.5, 25, 22, NOW() - INTERVAL '2 years');

-- Insert user profiles with gaming preferences
INSERT INTO user_profiles (user_id, display_name, bio, avatar_url, banner_url, location, gaming_stats, social_links, created_at) VALUES
('01234567-89ab-cdef-0123-456789abcdef', 'Alpha Wolf', 'Competitive FPS player and content creator. Always looking for new challenges!', '/avatars/alpha-wolf.jpg', '/banners/alpha-banner.jpg', 'Los Angeles, CA', '{"favorite_games": ["Call of Duty", "Valorant", "Apex Legends"], "hours_played": 2500, "achievements": 45, "preferred_platforms": ["PC", "Xbox"]}', '{"twitch": "alphawolf_gaming", "youtube": "AlphaWolfGaming", "twitter": "alphawolf_mlg"}', NOW() - INTERVAL '3 months'),
('11234567-89ab-cdef-0123-456789abcdef', 'Pro Shooter', 'Professional esports player. Multiple tournament wins.', '/avatars/pro-shooter.jpg', '/banners/pro-banner.jpg', 'Seoul, South Korea', '{"favorite_games": ["Counter-Strike", "Valorant", "Overwatch"], "hours_played": 5000, "achievements": 78, "preferred_platforms": ["PC"]}', '{"twitch": "proshooter_tv", "twitter": "proshooter_esports"}', NOW() - INTERVAL '6 months'),
('21234567-89ab-cdef-0123-456789abcdef', 'Stream Queen', 'Full-time content creator and community builder. Love helping new gamers!', '/avatars/stream-queen.jpg', '/banners/queen-banner.jpg', 'Toronto, Canada', '{"favorite_games": ["Minecraft", "Among Us", "Fall Guys"], "hours_played": 3500, "achievements": 120, "preferred_platforms": ["PC", "Nintendo Switch"]}', '{"twitch": "streamqueen", "youtube": "StreamQueenGaming", "instagram": "streamqueen_gaming", "tiktok": "streamqueengaming"}', NOW() - INTERVAL '1 year'),
('31234567-89ab-cdef-0123-456789abcdef', 'Clan Leader', 'Experienced clan leader and strategist. Building the best gaming community.', '/avatars/clan-leader.jpg', '/banners/leader-banner.jpg', 'London, UK', '{"favorite_games": ["League of Legends", "World of Warcraft", "Destiny 2"], "hours_played": 6000, "achievements": 150, "preferred_platforms": ["PC"]}', '{"discord": "ClanLeader#1337", "twitter": "clanleader_mlg"}', NOW() - INTERVAL '2 years'),
('41234567-89ab-cdef-0123-456789abcdef', 'Newbie Friend', 'New to competitive gaming but eager to learn! Always friendly and positive.', '/avatars/newbie-friend.jpg', '/banners/newbie-banner.jpg', 'Austin, TX', '{"favorite_games": ["Rocket League", "Fortnite"], "hours_played": 200, "achievements": 15, "preferred_platforms": ["Xbox", "PC"]}', '{"twitter": "newbie_friendly"}', NOW() - INTERVAL '1 month');

-- Insert sample clans with different tiers
INSERT INTO clans (id, name, slug, description, tier, staked_tokens, required_stake, owner_id, member_count, max_members, banner_url, logo_url, color_theme, rules, tags, is_public, is_verified, pda_address, created_at) VALUES
('a1234567-89ab-cdef-0123-456789abcdef', 'EliteGamers', 'elitegamers', 'A competitive gaming clan focused on FPS and strategy games. We welcome skilled players who are serious about improving their game.', 'gold', 1000.0, 1000.0, '31234567-89ab-cdef-0123-456789abcdef', 15, 100, '/banners/elite-gamers-banner.jpg', '/logos/elite-gamers.png', '#FFD700', ARRAY['Be respectful to all members', 'No cheating or exploits', 'Participate in clan events', 'Help newer members'], ARRAY['competitive', 'fps', 'strategy', 'tournaments'], true, true, 'EkJhLm9oXqRs8tUvYzA3BcDeF4GhI5JkLmNoP6QrS7TuVwXyZ', NOW() - INTERVAL '1.5 years'),
('b1234567-89ab-cdef-0123-456789abcdef', 'CasualFun', 'casualfun', 'Laid-back gaming clan for casual players. We focus on having fun and building friendships over competition.', 'silver', 500.0, 500.0, '21234567-89ab-cdef-0123-456789abcdef', 8, 50, '/banners/casual-fun-banner.jpg', '/logos/casual-fun.png', '#C0C0C0', ARRAY['Keep it friendly and fun', 'No toxic behavior', 'Everyone welcome regardless of skill'], ARRAY['casual', 'friendly', 'social', 'variety'], true, false, 'FlKiMn0pXqRs9uVwYzB4CdEfG5HiJ6KlMnOpQ7RsT8UvWxYyZ', NOW() - INTERVAL '10 months'),
('c1234567-89ab-cdef-0123-456789abcdef', 'ProLeague', 'proleague', 'Professional esports organization. Home to multiple championship teams across different games.', 'diamond', 5000.0, 5000.0, '71234567-89ab-cdef-0123-456789abcdef', 35, 250, '/banners/pro-league-banner.jpg', '/logos/pro-league.png', '#B9F2FF', ARRAY['Maintain professional conduct', 'Represent the org with pride', 'Commit to practice schedules', 'Follow team strategies'], ARRAY['professional', 'esports', 'championship', 'elite'], true, true, 'GmLjNo1qXrSt0vWxYzC5DeGfH6IiK7LmNoQpR8StU9VwXyZzA', NOW() - INTERVAL '3 years'),
('d1234567-89ab-cdef-0123-456789abcdef', 'StartupClan', 'startupclan', 'Brand new clan looking for founding members. Great opportunity to help shape a community!', 'bronze', 100.0, 100.0, '41234567-89ab-cdef-0123-456789abcdef', 3, 20, '/banners/startup-banner.jpg', '/logos/startup.png', '#CD7F32', ARRAY['Be patient as we grow', 'Contribute ideas for clan direction', 'Welcome new members'], ARRAY['new', 'growing', 'opportunity', 'founding'], true, false, 'HnMkOp2rXsTu1wXyZzD6EfHgI7JjL8MnOpQqS9TuV0WxYzAaB', NOW() - INTERVAL '2 weeks');

-- Insert clan members
INSERT INTO clan_members (clan_id, user_id, role, joined_at, invited_by, content_contributed, votes_cast_for_clan, tokens_contributed) VALUES
-- EliteGamers clan members
('a1234567-89ab-cdef-0123-456789abcdef', '31234567-89ab-cdef-0123-456789abcdef', 'owner', NOW() - INTERVAL '1.5 years', NULL, 15, 75, 1000.0),
('a1234567-89ab-cdef-0123-456789abcdef', '11234567-89ab-cdef-0123-456789abcdef', 'admin', NOW() - INTERVAL '1.2 years', '31234567-89ab-cdef-0123-456789abcdef', 8, 45, 200.0),
('a1234567-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcdef', 'moderator', NOW() - INTERVAL '8 months', '31234567-89ab-cdef-0123-456789abcdef', 6, 30, 100.0),
('a1234567-89ab-cdef-0123-456789abcdef', '61234567-89ab-cdef-0123-456789abcdef', 'member', NOW() - INTERVAL '6 months', '11234567-89ab-cdef-0123-456789abcdef', 4, 20, 50.0),

-- CasualFun clan members  
('b1234567-89ab-cdef-0123-456789abcdef', '21234567-89ab-cdef-0123-456789abcdef', 'owner', NOW() - INTERVAL '10 months', NULL, 12, 40, 500.0),
('b1234567-89ab-cdef-0123-456789abcdef', '81234567-89ab-cdef-0123-456789abcdef', 'member', NOW() - INTERVAL '5 months', '21234567-89ab-cdef-0123-456789abcdef', 2, 15, 25.0),
('b1234567-89ab-cdef-0123-456789abcdef', '91234567-89ab-cdef-0123-456789abcdef', 'member', NOW() - INTERVAL '3 months', '21234567-89ab-cdef-0123-456789abcdef', 5, 25, 75.0),

-- ProLeague clan members
('c1234567-89ab-cdef-0123-456789abcdef', '71234567-89ab-cdef-0123-456789abcdef', 'owner', NOW() - INTERVAL '3 years', NULL, 25, 150, 5000.0),
('c1234567-89ab-cdef-0123-456789abcdef', '51234567-89ab-cdef-0123-456789abcdef', 'admin', NOW() - INTERVAL '2.5 years', '71234567-89ab-cdef-0123-456789abcdef', 20, 100, 1000.0),

-- StartupClan members
('d1234567-89ab-cdef-0123-456789abcdef', '41234567-89ab-cdef-0123-456789abcdef', 'owner', NOW() - INTERVAL '2 weeks', NULL, 1, 5, 100.0);

-- Insert sample blockchain transactions
INSERT INTO blockchain_transactions (id, user_id, transaction_signature, transaction_type, amount, token_mint, from_address, to_address, status, block_height, slot, network, fee_lamports, created_at) VALUES
('tx123456-89ab-cdef-0123-456789abcdef', '31234567-89ab-cdef-0123-456789abcdef', '5VtE8B4CJkFsjRAKWd2QNjhkxPwP4Y5qGSdZGfMGZwKRxMnvQe12H5ZKgvF8r3tEWm9YpLz2s4GqHjK', 'clan_stake', 1000.0, '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'EkJhLm9oXqRs8tUvYzA3BcDeF4GhI5JkLmNoP6QrS7TuVwXyZ', 'confirmed', 12345678, 87654321, 'mainnet', 5000, NOW() - INTERVAL '1.5 years'),
('tx223456-89ab-cdef-0123-456789abcdef', '21234567-89ab-cdef-0123-456789abcdef', '6WuF9C5DKlGtkSBLXe3ROkjlxQwQ5Z6rHTeFHgNHaxLSyNowRf23I6aLhwG9s4uFXn0ZqMa3t5HrIkL', 'clan_stake', 500.0, '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL', 'AaK8t2wKmhgJt5xZmhJk9uERAz7DsGYdLVL9zYtBWWN', 'FlKiMn0pXqRs9uVwYzB4CdEfG5HiJ6KlMnOpQ7RsT8UvWxYyZ', 'confirmed', 23456789, 98765432, 'mainnet', 5000, NOW() - INTERVAL '10 months'),
('tx323456-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcdef', '7XvG0D6ELmHulTCMyf4SPljmyRxR6a7sIUgGIhOIbyMTzOpxSg34J7bMixH0t5vGYo1ArNb4u6IsJlM', 'vote_burn', 5.0, '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', '11111111111111111111111111111112', 'confirmed', 34567890, 10987654, 'mainnet', 5000, NOW() - INTERVAL '1 month'),
('tx423456-89ab-cdef-0123-456789abcdef', '11234567-89ab-cdef-0123-456789abcdef', '8YwH1E7FMnIvmUDNzg5TQmknzSyS7b8tJVhHJiPJczNUaQqyTh45K8cNjyI1u6wHZp2BsOc5v7JtKmN', 'vote_burn', 10.0, '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL', 'AaK8t2wKmhgJt5xZmhJk9uERAz7DsGYdLVL9zYtBWWN', '11111111111111111111111111111112', 'confirmed', 45678901, 21098765, 'mainnet', 5000, NOW() - INTERVAL '2 weeks');

-- Insert voting transactions
INSERT INTO voting_transactions (id, user_id, blockchain_transaction_id, votes_purchased, mlg_tokens_burned, cost_per_vote, votes_remaining, votes_used, valid_until, created_at) VALUES
('vt123456-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcdef', 'tx323456-89ab-cdef-0123-456789abcdef', 3, 5.0, 1.67, 1, 2, CURRENT_DATE + INTERVAL '1 day', NOW() - INTERVAL '1 month'),
('vt223456-89ab-cdef-0123-456789abcdef', '11234567-89ab-cdef-0123-456789abcdef', 'tx423456-89ab-cdef-0123-456789abcdef', 4, 10.0, 2.5, 2, 2, CURRENT_DATE + INTERVAL '1 day', NOW() - INTERVAL '2 weeks');

-- Insert sample content submissions
INSERT INTO content_submissions (id, user_id, clan_id, title, description, content_type, gaming_platform, category, game_title, file_url, thumbnail_url, file_size, duration_seconds, status, upvote_count, downvote_count, view_count, tags, created_at) VALUES
('cs123456-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcdef', 'a1234567-89ab-cdef-0123-456789abcdef', 'Epic Valorant Clutch - 1v4 ACE', 'Insane 1v4 clutch in ranked Valorant match. Watch me pull off this amazing ace to win the round!', 'video', 'pc', 'highlights', 'Valorant', '/content/videos/valorant-clutch-alpha.mp4', '/content/thumbnails/valorant-clutch-alpha.jpg', 125000000, 45, 'approved', 156, 12, 2340, ARRAY['valorant', 'clutch', 'ace', '1v4', 'ranked'], NOW() - INTERVAL '2 weeks'),
('cs223456-89ab-cdef-0123-456789abcdef', '21234567-89ab-cdef-0123-456789abcdef', 'b1234567-89ab-cdef-0123-456789abcdef', 'Minecraft Castle Build Tutorial', 'Step-by-step tutorial on how to build an amazing medieval castle in Minecraft. Perfect for beginners!', 'video', 'pc', 'tutorials', 'Minecraft', '/content/videos/minecraft-castle-tutorial.mp4', '/content/thumbnails/minecraft-castle.jpg', 450000000, 720, 'approved', 89, 5, 1567, ARRAY['minecraft', 'tutorial', 'castle', 'build', 'medieval'], NOW() - INTERVAL '1 month'),
('cs323456-89ab-cdef-0123-456789abcdef', '11234567-89ab-cdef-0123-456789abcdef', 'a1234567-89ab-cdef-0123-456789abcdef', 'Counter-Strike Smoke Lineups Guide', 'Complete guide to essential smoke lineups for Mirage map in CS2. Improve your utility game!', 'video', 'pc', 'guide', 'Counter-Strike 2', '/content/videos/cs-smoke-guide.mp4', '/content/thumbnails/cs-smoke-guide.jpg', 200000000, 180, 'approved', 234, 8, 3456, ARRAY['cs2', 'smoke', 'lineups', 'mirage', 'utility'], NOW() - INTERVAL '3 weeks'),
('cs423456-89ab-cdef-0123-456789abcdef', '51234567-89ab-cdef-0123-456789abcdef', 'c1234567-89ab-cdef-0123-456789abcdef', 'Tournament Highlights Montage', 'Best moments from our recent tournament victories. Amazing plays and teamwork on display!', 'video', 'pc', 'competitive', 'League of Legends', '/content/videos/tournament-highlights.mp4', '/content/thumbnails/tournament-highlights.jpg', 300000000, 240, 'approved', 445, 15, 5678, ARRAY['tournament', 'highlights', 'lol', 'competitive', 'teamwork'], NOW() - INTERVAL '1 week'),
('cs523456-89ab-cdef-0123-456789abcdef', '81234567-89ab-cdef-0123-456789abcdef', 'b1234567-89ab-cdef-0123-456789abcdef', 'Funny Gaming Fails Compilation', 'Hilarious gaming fails and bloopers from our casual gaming sessions. Good laughs guaranteed!', 'video', 'xbox', 'funny', 'Fall Guys', '/content/videos/funny-fails.mp4', '/content/thumbnails/funny-fails.jpg', 180000000, 300, 'approved', 312, 22, 4123, ARRAY['funny', 'fails', 'bloopers', 'casual', 'laughs'], NOW() - INTERVAL '5 days');

-- Insert content votes
INSERT INTO content_votes (content_id, user_id, vote_type, voting_transaction_id, is_daily_vote, clan_bonus, vote_weight, created_at) VALUES
-- Votes for Valorant clutch video
('cs123456-89ab-cdef-0123-456789abcdef', '11234567-89ab-cdef-0123-456789abcdef', 'upvote', 'vt223456-89ab-cdef-0123-456789abcdef', false, true, 1.5, NOW() - INTERVAL '2 weeks'),
('cs123456-89ab-cdef-0123-456789abcdef', '21234567-89ab-cdef-0123-456789abcdef', 'upvote', NULL, true, false, 1.0, NOW() - INTERVAL '2 weeks'),
('cs123456-89ab-cdef-0123-456789abcdef', '31234567-89ab-cdef-0123-456789abcdef', 'upvote', NULL, true, true, 1.2, NOW() - INTERVAL '13 days'),
('cs123456-89ab-cdef-0123-456789abcdef', '51234567-89ab-cdef-0123-456789abcdef', 'upvote', NULL, true, false, 1.0, NOW() - INTERVAL '12 days'),

-- Votes for Minecraft tutorial
('cs223456-89ab-cdef-0123-456789abcdef', '01234567-89ab-cdef-0123-456789abcdef', 'upvote', 'vt123456-89ab-cdef-0123-456789abcdef', false, false, 1.0, NOW() - INTERVAL '1 month'),
('cs223456-89ab-cdef-0123-456789abcdef', '41234567-89ab-cdef-0123-456789abcdef', 'upvote', NULL, true, false, 1.0, NOW() - INTERVAL '25 days'),
('cs223456-89ab-cdef-0123-456789abcdef', '61234567-89ab-cdef-0123-456789abcdef', 'upvote', NULL, true, false, 1.0, NOW() - INTERVAL '20 days');

-- Insert sample voting proposals
INSERT INTO voting_proposals (id, clan_id, creator_id, title, description, proposal_type, voting_ends_at, upvotes, downvotes, total_participants, status, tags, created_at) VALUES
('vp123456-89ab-cdef-0123-456789abcdef', 'a1234567-89ab-cdef-0123-456789abcdef', '31234567-89ab-cdef-0123-456789abcdef', 'Upgrade Clan to Diamond Tier', 'Proposal to upgrade our clan to Diamond tier for access to advanced features and increased member capacity.', 'tier_upgrade', NOW() + INTERVAL '3 days', 12, 2, 14, 'active', ARRAY['upgrade', 'diamond', 'features'], NOW() - INTERVAL '2 days'),
('vp223456-89ab-cdef-0123-456789abcdef', 'b1234567-89ab-cdef-0123-456789abcdef', '21234567-89ab-cdef-0123-456789abcdef', 'Weekly Game Night Schedule', 'Establish regular weekly game nights every Friday at 8 PM EST for clan bonding and fun.', 'clan_rule', NOW() + INTERVAL '5 days', 6, 1, 7, 'active', ARRAY['schedule', 'game-night', 'weekly'], NOW() - INTERVAL '1 day');

-- Insert sample achievements (additional to the ones in schema)
INSERT INTO achievements (name, slug, description, achievement_type, requirements, reward_mlg_tokens, reward_reputation, icon_url, rarity, category, is_active) VALUES
('Clan Joiner', 'clan-joiner', 'Join your first clan', 'clan', '{"clans_joined": 1}', 3.0, 15, '/icons/achievements/clan-joiner.png', 'common', 'clan', true),
('Content Critic', 'content-critic', 'Vote on 50 pieces of content', 'voting', '{"votes_cast": 50}', 8.0, 25, '/icons/achievements/content-critic.png', 'uncommon', 'voting', true),
('Popular Creator', 'popular-creator', 'Get 500 total upvotes on your content', 'content', '{"total_upvotes_received": 500}', 25.0, 100, '/icons/achievements/popular-creator.png', 'rare', 'content', true),
('Community Helper', 'community-helper', 'Help 10 new users by voting on their first content', 'social', '{"helped_new_users": 10}', 12.0, 50, '/icons/achievements/community-helper.png', 'uncommon', 'social', true);

-- Insert achievement progress for users
INSERT INTO achievement_progress (user_id, achievement_id, current_progress, completion_count, is_completed, first_completed_at, rewards_claimed, claimed_at) VALUES
-- User achievements for GamerAlpha (id: 01234567...)
('01234567-89ab-cdef-0123-456789abcdef', (SELECT id FROM achievements WHERE slug = 'first-vote'), '{"votes_cast": 45}', 1, true, NOW() - INTERVAL '2 months', true, NOW() - INTERVAL '2 months'),
('01234567-89ab-cdef-0123-456789abcdef', (SELECT id FROM achievements WHERE slug = 'content-creator'), '{"content_submitted": 12}', 1, true, NOW() - INTERVAL '1 month', true, NOW() - INTERVAL '1 month'),
('01234567-89ab-cdef-0123-456789abcdef', (SELECT id FROM achievements WHERE slug = 'clan-joiner'), '{"clans_joined": 1}', 1, true, NOW() - INTERVAL '8 months', true, NOW() - INTERVAL '8 months'),

-- User achievements for StreamQueen (id: 21234567...)
('21234567-89ab-cdef-0123-456789abcdef', (SELECT id FROM achievements WHERE slug = 'first-vote'), '{"votes_cast": 120}', 1, true, NOW() - INTERVAL '11 months', true, NOW() - INTERVAL '11 months'),
('21234567-89ab-cdef-0123-456789abcdef', (SELECT id FROM achievements WHERE slug = 'vote-enthusiast'), '{"votes_cast": 120}', 1, true, NOW() - INTERVAL '6 months', true, NOW() - INTERVAL '6 months'),
('21234567-89ab-cdef-0123-456789abcdef', (SELECT id FROM achievements WHERE slug = 'content-creator'), '{"content_submitted": 35}', 1, true, NOW() - INTERVAL '10 months', true, NOW() - INTERVAL '10 months'),
('21234567-89ab-cdef-0123-456789abcdef', (SELECT id FROM achievements WHERE slug = 'clan-founder'), '{"clans_created": 1}', 1, true, NOW() - INTERVAL '10 months', true, NOW() - INTERVAL '10 months');

-- Insert some user sessions (recent logins)
INSERT INTO user_sessions (user_id, session_token, wallet_signature, message_signed, ip_address, user_agent, expires_at, last_activity, created_at) VALUES
('01234567-89ab-cdef-0123-456789abcdef', '5f8a3b2e1d0c9f7e6d5c4b3a2e1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0', '3sK9vF7wX2qE8rY6tP0mL4jH1nC5bV9zA8xS3fG7dQ2wE6rT0yU4iO8pL1sD5fG9hJ3kN6mQ0xZ4cV7bN2wE8rY5tP9oI3uA6', 'Sign this message to authenticate: 1704067200000', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() + INTERVAL '7 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '3 hours'),
('21234567-89ab-cdef-0123-456789abcdef', '7a9c5f8e2b1d0c9f7e6d5c4b3a2e1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2', '5tL2wG8yZ4sF0rU7qR3oM6kI9nD7cX1aB0zT5hH3eS8xW4vY9uP2mL6jN1sE7gK5hM2', 'Sign this message to authenticate: 1704070800000', '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() + INTERVAL '7 days', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '2 hours'),
('31234567-89ab-cdef-0123-456789abcdef', '9b3d7f2a4e8c1f5a9d7c3e6b4a8f2e5d9c7a4f1e8c5b2a9f6e3d7c1a5f9e2d8c4b', '7vN4yI0rW6fZ2sH8qL5pR9oM3kJ7nC1aE8xV5gB3dF0yT6uY2sR9qL4pN8mK1jI5hG', 'Sign this message to authenticate: 1704074400000', '203.0.113.25', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', NOW() + INTERVAL '7 days', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '1 hour');

-- Update clan member counts (in case triggers don't fire in dev)
UPDATE clans SET member_count = (
    SELECT COUNT(*) FROM clan_members WHERE clan_id = clans.id AND is_active = true
);

-- Update content vote counts
UPDATE content_submissions SET 
    upvote_count = (SELECT COUNT(*) FROM content_votes WHERE content_id = content_submissions.id AND vote_type = 'upvote'),
    downvote_count = (SELECT COUNT(*) FROM content_votes WHERE content_id = content_submissions.id AND vote_type = 'downvote');

-- Update user statistics
UPDATE users SET 
    total_votes_cast = (SELECT COUNT(*) FROM content_votes WHERE user_id = users.id),
    total_content_submitted = (SELECT COUNT(*) FROM content_submissions WHERE user_id = users.id),
    total_content_approved = (SELECT COUNT(*) FROM content_submissions WHERE user_id = users.id AND status = 'approved');

COMMIT;

-- Verify seed data
SELECT 
    'Users' as entity,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Clans' as entity,
    COUNT(*) as count  
FROM clans
UNION ALL
SELECT 
    'Content Submissions' as entity,
    COUNT(*) as count
FROM content_submissions
UNION ALL
SELECT 
    'Achievements' as entity,
    COUNT(*) as count
FROM achievements
UNION ALL
SELECT 
    'Active Sessions' as entity,
    COUNT(*) as count
FROM user_sessions WHERE is_active = true;

-- Display sample data summary
SELECT 
    'Seed data loaded successfully!' as status,
    NOW() as loaded_at;