-- MLG.clan Platform PostgreSQL Database Schema
-- Comprehensive schema for gaming platform with blockchain integration
-- Version: 1.0.0
-- Created: 2025-08-10
-- Author: Claude Code - API Architect

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Drop existing tables in correct order (reverse of creation)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS achievement_progress CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS content_moderation_logs CASCADE;
DROP TABLE IF EXISTS content_votes CASCADE;
DROP TABLE IF EXISTS content_submissions CASCADE;
DROP TABLE IF EXISTS voting_proposals CASCADE;
DROP TABLE IF EXISTS voting_transactions CASCADE;
DROP TABLE IF EXISTS clan_invitations CASCADE;
DROP TABLE IF EXISTS clan_members CASCADE;
DROP TABLE IF EXISTS clans CASCADE;
DROP TABLE IF EXISTS blockchain_transactions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM types for better data integrity
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned', 'suspended');
CREATE TYPE clan_tier AS ENUM ('bronze', 'silver', 'gold', 'diamond');
CREATE TYPE clan_member_role AS ENUM ('owner', 'admin', 'moderator', 'member');
CREATE TYPE content_status AS ENUM ('pending', 'approved', 'rejected', 'flagged', 'removed');
CREATE TYPE content_type AS ENUM ('video', 'image', 'document', 'audio', 'stream');
CREATE TYPE gaming_platform AS ENUM ('xbox', 'playstation', 'pc', 'mobile', 'nintendo', 'steam-deck', 'other');
CREATE TYPE content_category AS ENUM ('highlights', 'gameplay', 'tutorials', 'funny', 'competitive', 'speedrun', 'review', 'guide');
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');
CREATE TYPE achievement_type AS ENUM ('voting', 'content', 'clan', 'social', 'milestone');

-- Users table - Core user data with wallet addresses and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL, -- Solana wallet address (Base58)
    username VARCHAR(32) UNIQUE, -- Optional username
    email CITEXT, -- Case-insensitive email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    status user_status DEFAULT 'active',
    
    -- Wallet verification and security
    wallet_verified BOOLEAN DEFAULT FALSE,
    verification_signature TEXT, -- Signature proof of wallet ownership
    verification_message TEXT, -- Message signed by wallet
    verification_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Rate limiting and security
    daily_vote_count INTEGER DEFAULT 0,
    last_vote_reset DATE DEFAULT CURRENT_DATE,
    consecutive_days_voted INTEGER DEFAULT 0,
    total_votes_cast INTEGER DEFAULT 0,
    total_mlg_burned DECIMAL(20, 9) DEFAULT 0,
    
    -- Platform statistics
    reputation_score INTEGER DEFAULT 0,
    total_content_submitted INTEGER DEFAULT 0,
    total_content_approved INTEGER DEFAULT 0,
    
    -- Privacy and preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    profile_visibility VARCHAR(10) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    
    -- Constraints and indexes
    CONSTRAINT valid_wallet_address CHECK (LENGTH(wallet_address) BETWEEN 32 AND 44),
    CONSTRAINT valid_username CHECK (username IS NULL OR (LENGTH(username) >= 3 AND username ~ '^[a-zA-Z0-9_-]+$')),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Create indexes for users table
CREATE INDEX idx_users_wallet_address ON users (wallet_address);
CREATE INDEX idx_users_username ON users (username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_email ON users (email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_users_last_vote_reset ON users (last_vote_reset);

-- User profiles table - Extended user information
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(50),
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    location VARCHAR(100),
    website_url TEXT,
    social_links JSONB DEFAULT '{}', -- Social media links
    gaming_stats JSONB DEFAULT '{}', -- Gaming statistics and preferences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_display_name CHECK (display_name IS NULL OR LENGTH(display_name) BETWEEN 1 AND 50),
    CONSTRAINT valid_bio CHECK (bio IS NULL OR LENGTH(bio) <= 500),
    CONSTRAINT valid_website_url CHECK (website_url IS NULL OR website_url ~ '^https?://.+'),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX idx_user_profiles_display_name ON user_profiles (display_name) WHERE display_name IS NOT NULL;

-- Blockchain transactions table - Track all Solana transactions
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_signature VARCHAR(88) UNIQUE NOT NULL, -- Solana transaction signature
    transaction_type VARCHAR(50) NOT NULL, -- 'vote_burn', 'clan_stake', 'clan_unstake', 'transfer', etc.
    
    -- Transaction details
    amount DECIMAL(20, 9), -- Token amount (supports MLG token decimals)
    token_mint VARCHAR(44), -- Token mint address
    from_address VARCHAR(44), -- Source wallet
    to_address VARCHAR(44), -- Destination wallet
    
    -- Status and timing
    status transaction_status DEFAULT 'pending',
    block_height BIGINT,
    slot BIGINT,
    confirmation_status VARCHAR(20), -- 'processed', 'confirmed', 'finalized'
    
    -- Network and fees
    network VARCHAR(20) DEFAULT 'mainnet', -- 'mainnet', 'testnet', 'devnet'
    fee_lamports BIGINT, -- Transaction fee in lamports
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Additional transaction data
    error_message TEXT, -- Error details if transaction failed
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_signature_length CHECK (LENGTH(transaction_signature) BETWEEN 86 AND 88),
    CONSTRAINT valid_network CHECK (network IN ('mainnet', 'testnet', 'devnet')),
    CONSTRAINT positive_amount CHECK (amount IS NULL OR amount >= 0),
    CONSTRAINT positive_fee CHECK (fee_lamports IS NULL OR fee_lamports >= 0)
);

-- Create indexes for blockchain transactions
CREATE INDEX idx_blockchain_transactions_user_id ON blockchain_transactions (user_id);
CREATE INDEX idx_blockchain_transactions_signature ON blockchain_transactions (transaction_signature);
CREATE INDEX idx_blockchain_transactions_type ON blockchain_transactions (transaction_type);
CREATE INDEX idx_blockchain_transactions_status ON blockchain_transactions (status);
CREATE INDEX idx_blockchain_transactions_created_at ON blockchain_transactions (created_at DESC);
CREATE INDEX idx_blockchain_transactions_token_mint ON blockchain_transactions (token_mint) WHERE token_mint IS NOT NULL;

-- Clans table - Gaming clan management with token staking
CREATE TABLE clans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(32) UNIQUE NOT NULL,
    slug VARCHAR(32) UNIQUE NOT NULL, -- URL-friendly name
    description TEXT,
    
    -- Clan tier and staking
    tier clan_tier DEFAULT 'bronze',
    staked_tokens DECIMAL(20, 9) DEFAULT 0,
    required_stake DECIMAL(20, 9) DEFAULT 100, -- Minimum MLG tokens required
    
    -- Ownership and management
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Membership limits and statistics
    member_count INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 20,
    
    -- Visual customization
    banner_url TEXT,
    logo_url TEXT,
    color_theme VARCHAR(7), -- Hex color
    
    -- Clan rules and tags
    rules TEXT[],
    tags VARCHAR(25)[],
    
    -- Status and visibility
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Blockchain integration
    pda_address VARCHAR(44), -- Program Derived Address on Solana
    pda_bump SMALLINT, -- PDA bump seed
    staking_transaction_id UUID REFERENCES blockchain_transactions(id),
    
    -- Governance and voting
    voting_enabled BOOLEAN DEFAULT TRUE,
    proposal_threshold DECIMAL(20, 9) DEFAULT 10, -- Tokens needed to create proposal
    
    -- Statistics and activity
    total_content_submitted INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    activity_score INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_clan_name CHECK (LENGTH(name) BETWEEN 3 AND 32 AND name ~ '^[a-zA-Z0-9_-]+$'),
    CONSTRAINT valid_clan_slug CHECK (LENGTH(slug) BETWEEN 3 AND 32 AND slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_description CHECK (description IS NULL OR LENGTH(description) <= 1000),
    CONSTRAINT positive_staked_tokens CHECK (staked_tokens >= 0),
    CONSTRAINT positive_required_stake CHECK (required_stake >= 0),
    CONSTRAINT valid_member_limits CHECK (member_count >= 0 AND max_members > 0 AND member_count <= max_members),
    CONSTRAINT valid_color_theme CHECK (color_theme IS NULL OR color_theme ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT valid_pda_address CHECK (pda_address IS NULL OR LENGTH(pda_address) BETWEEN 32 AND 44),
    CONSTRAINT reasonable_tags_count CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10)
);

-- Create indexes for clans table
CREATE INDEX idx_clans_name ON clans (name);
CREATE INDEX idx_clans_slug ON clans (slug);
CREATE INDEX idx_clans_owner_id ON clans (owner_id);
CREATE INDEX idx_clans_tier ON clans (tier);
CREATE INDEX idx_clans_status ON clans (status);
CREATE INDEX idx_clans_created_at ON clans (created_at DESC);
CREATE INDEX idx_clans_public ON clans (is_public) WHERE is_public = TRUE;
CREATE INDEX idx_clans_verified ON clans (is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_clans_activity_score ON clans (activity_score DESC);
CREATE INDEX idx_clans_tags ON clans USING GIN (tags);

-- Clan members table - Track clan membership and roles
CREATE TABLE clan_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role clan_member_role DEFAULT 'member',
    
    -- Membership details
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Member statistics and contributions
    content_contributed INTEGER DEFAULT 0,
    votes_cast_for_clan INTEGER DEFAULT 0,
    tokens_contributed DECIMAL(20, 9) DEFAULT 0,
    
    -- Member status
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Notes and moderation
    notes TEXT, -- Admin notes about member
    warned_count INTEGER DEFAULT 0,
    last_warned_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_clan_member UNIQUE (clan_id, user_id),
    CONSTRAINT positive_contributions CHECK (
        content_contributed >= 0 AND 
        votes_cast_for_clan >= 0 AND 
        tokens_contributed >= 0 AND
        warned_count >= 0
    )
);

-- Create indexes for clan members table
CREATE INDEX idx_clan_members_clan_id ON clan_members (clan_id);
CREATE INDEX idx_clan_members_user_id ON clan_members (user_id);
CREATE INDEX idx_clan_members_role ON clan_members (role);
CREATE INDEX idx_clan_members_joined_at ON clan_members (joined_at DESC);
CREATE INDEX idx_clan_members_active ON clan_members (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_clan_members_last_activity ON clan_members (last_activity DESC);

-- Clan invitations table - Manage clan membership invitations
CREATE TABLE clan_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Invitation details
    role clan_member_role DEFAULT 'member',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_message_length CHECK (message IS NULL OR LENGTH(message) <= 500),
    CONSTRAINT future_expiry CHECK (expires_at > created_at),
    CONSTRAINT unique_pending_invitation UNIQUE (clan_id, invited_user_id, status) 
        DEFERRABLE INITIALLY DEFERRED -- Allow updates during status changes
);

-- Create indexes for clan invitations table
CREATE INDEX idx_clan_invitations_clan_id ON clan_invitations (clan_id);
CREATE INDEX idx_clan_invitations_invited_user_id ON clan_invitations (invited_user_id);
CREATE INDEX idx_clan_invitations_invited_by_user_id ON clan_invitations (invited_by_user_id);
CREATE INDEX idx_clan_invitations_status ON clan_invitations (status);
CREATE INDEX idx_clan_invitations_expires_at ON clan_invitations (expires_at) WHERE status = 'pending';

-- Voting transactions table - Track MLG token burns for votes
CREATE TABLE voting_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blockchain_transaction_id UUID NOT NULL REFERENCES blockchain_transactions(id) ON DELETE RESTRICT,
    
    -- Vote details
    votes_purchased INTEGER NOT NULL CHECK (votes_purchased > 0 AND votes_purchased <= 4),
    mlg_tokens_burned DECIMAL(20, 9) NOT NULL CHECK (mlg_tokens_burned > 0),
    cost_per_vote DECIMAL(20, 9) NOT NULL CHECK (cost_per_vote > 0),
    
    -- Usage tracking
    votes_remaining INTEGER NOT NULL,
    votes_used INTEGER DEFAULT 0,
    
    -- Timing and validity
    valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT consistent_vote_counts CHECK (votes_used + votes_remaining = votes_purchased),
    CONSTRAINT future_validity CHECK (valid_until >= CURRENT_DATE)
);

-- Create indexes for voting transactions table
CREATE INDEX idx_voting_transactions_user_id ON voting_transactions (user_id);
CREATE INDEX idx_voting_transactions_blockchain_tx ON voting_transactions (blockchain_transaction_id);
CREATE INDEX idx_voting_transactions_valid_until ON voting_transactions (valid_until);
CREATE INDEX idx_voting_transactions_created_at ON voting_transactions (created_at DESC);
CREATE INDEX idx_voting_transactions_votes_remaining ON voting_transactions (votes_remaining) WHERE votes_remaining > 0;

-- Voting proposals table - Clan governance and community proposals
CREATE TABLE voting_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID REFERENCES clans(id) ON DELETE CASCADE, -- NULL for community-wide proposals
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Proposal content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    proposal_type VARCHAR(50) NOT NULL, -- 'clan_rule', 'member_kick', 'tier_upgrade', 'community_feature', etc.
    
    -- Voting parameters
    voting_starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voting_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    minimum_participation INTEGER DEFAULT 5, -- Minimum voters required
    
    -- Vote tallies
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    
    -- Status and outcome
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'passed', 'failed', 'cancelled', 'expired')),
    outcome TEXT, -- Description of the result/action taken
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Additional proposal data
    tags VARCHAR(25)[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_title_length CHECK (LENGTH(title) BETWEEN 10 AND 200),
    CONSTRAINT valid_description_length CHECK (LENGTH(description) BETWEEN 20 AND 2000),
    CONSTRAINT valid_voting_period CHECK (voting_ends_at > voting_starts_at),
    CONSTRAINT positive_vote_counts CHECK (upvotes >= 0 AND downvotes >= 0 AND total_participants >= 0),
    CONSTRAINT reasonable_participation CHECK (minimum_participation > 0),
    CONSTRAINT reasonable_tags_count CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 5)
);

-- Create indexes for voting proposals table
CREATE INDEX idx_voting_proposals_clan_id ON voting_proposals (clan_id);
CREATE INDEX idx_voting_proposals_creator_id ON voting_proposals (creator_id);
CREATE INDEX idx_voting_proposals_status ON voting_proposals (status);
CREATE INDEX idx_voting_proposals_voting_ends_at ON voting_proposals (voting_ends_at);
CREATE INDEX idx_voting_proposals_created_at ON voting_proposals (created_at DESC);
CREATE INDEX idx_voting_proposals_tags ON voting_proposals USING GIN (tags);
CREATE INDEX idx_voting_proposals_type ON voting_proposals (proposal_type);

-- Content submissions table - User-generated gaming content
CREATE TABLE content_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clan_id UUID REFERENCES clans(id) ON DELETE SET NULL, -- Content can be clan-associated
    
    -- Content metadata
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    content_type content_type NOT NULL,
    gaming_platform gaming_platform NOT NULL,
    category content_category NOT NULL,
    game_title VARCHAR(100) NOT NULL,
    
    -- File information
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size BIGINT, -- File size in bytes
    duration_seconds INTEGER, -- For video/audio content
    dimensions JSONB, -- For images/videos: {"width": 1920, "height": 1080}
    
    -- Content classification and moderation
    status content_status DEFAULT 'pending',
    moderation_flags TEXT[], -- Array of flags: ['violence', 'profanity', 'spam', etc.]
    moderation_notes TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- Content features and visibility
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP WITH TIME ZONE,
    is_nsfw BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(10) DEFAULT 'public' CHECK (visibility IN ('public', 'clan', 'private')),
    
    -- Tags and searchability
    tags VARCHAR(25)[] DEFAULT '{}',
    search_vector tsvector, -- Full-text search vector
    
    -- Technical metadata
    encoding_details JSONB DEFAULT '{}', -- Video/audio encoding information
    upload_metadata JSONB DEFAULT '{}', -- Original upload information
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_title_length CHECK (LENGTH(title) BETWEEN 3 AND 200),
    CONSTRAINT valid_description_length CHECK (LENGTH(description) BETWEEN 10 AND 1000),
    CONSTRAINT valid_game_title CHECK (LENGTH(game_title) BETWEEN 2 AND 100),
    CONSTRAINT positive_metrics CHECK (
        view_count >= 0 AND upvote_count >= 0 AND downvote_count >= 0 AND 
        comment_count >= 0 AND share_count >= 0
    ),
    CONSTRAINT positive_file_size CHECK (file_size IS NULL OR file_size > 0),
    CONSTRAINT positive_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT reasonable_tags_count CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 15)
);

-- Create indexes for content submissions table
CREATE INDEX idx_content_submissions_user_id ON content_submissions (user_id);
CREATE INDEX idx_content_submissions_clan_id ON content_submissions (clan_id);
CREATE INDEX idx_content_submissions_status ON content_submissions (status);
CREATE INDEX idx_content_submissions_content_type ON content_submissions (content_type);
CREATE INDEX idx_content_submissions_platform ON content_submissions (gaming_platform);
CREATE INDEX idx_content_submissions_category ON content_submissions (category);
CREATE INDEX idx_content_submissions_game_title ON content_submissions (game_title);
CREATE INDEX idx_content_submissions_created_at ON content_submissions (created_at DESC);
CREATE INDEX idx_content_submissions_featured ON content_submissions (is_featured, featured_until) WHERE is_featured = TRUE;
CREATE INDEX idx_content_submissions_tags ON content_submissions USING GIN (tags);
CREATE INDEX idx_content_submissions_search ON content_submissions USING GIN (search_vector);
CREATE INDEX idx_content_submissions_visibility ON content_submissions (visibility);
CREATE INDEX idx_content_submissions_engagement ON content_submissions (upvote_count DESC, view_count DESC);

-- Content votes table - Track user votes on content
CREATE TABLE content_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    
    -- Vote source tracking
    voting_transaction_id UUID REFERENCES voting_transactions(id), -- NULL for daily free votes
    is_daily_vote BOOLEAN DEFAULT TRUE, -- FALSE if purchased with MLG tokens
    
    -- Voting context
    clan_bonus BOOLEAN DEFAULT FALSE, -- TRUE if user gets clan voting bonus
    vote_weight DECIMAL(3, 2) DEFAULT 1.0, -- Vote weight (1.0 = normal, can be boosted)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_content_vote UNIQUE (content_id, user_id),
    CONSTRAINT valid_vote_weight CHECK (vote_weight > 0 AND vote_weight <= 5.0)
);

-- Create indexes for content votes table
CREATE INDEX idx_content_votes_content_id ON content_votes (content_id);
CREATE INDEX idx_content_votes_user_id ON content_votes (user_id);
CREATE INDEX idx_content_votes_type ON content_votes (vote_type);
CREATE INDEX idx_content_votes_created_at ON content_votes (created_at DESC);
CREATE INDEX idx_content_votes_transaction_id ON content_votes (voting_transaction_id) WHERE voting_transaction_id IS NOT NULL;

-- Content moderation logs table - Audit trail for content moderation
CREATE TABLE content_moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be system moderation
    
    -- Moderation action details
    action VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'flag', 'remove', 'restore'
    previous_status content_status,
    new_status content_status NOT NULL,
    
    -- Reasoning and notes
    reason VARCHAR(100), -- Short reason code
    notes TEXT, -- Detailed explanation
    flags_added TEXT[], -- Flags added in this action
    flags_removed TEXT[], -- Flags removed in this action
    
    -- System or manual moderation
    is_automated BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3, 2), -- AI confidence score (0.00 to 1.00)
    
    -- Appeal and review
    can_be_appealed BOOLEAN DEFAULT TRUE,
    appeal_deadline TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_confidence_score CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
    CONSTRAINT valid_reason_length CHECK (reason IS NULL OR LENGTH(reason) <= 100),
    CONSTRAINT valid_notes_length CHECK (notes IS NULL OR LENGTH(notes) <= 2000)
);

-- Create indexes for content moderation logs table
CREATE INDEX idx_content_moderation_logs_content_id ON content_moderation_logs (content_id);
CREATE INDEX idx_content_moderation_logs_moderator_id ON content_moderation_logs (moderator_id);
CREATE INDEX idx_content_moderation_logs_action ON content_moderation_logs (action);
CREATE INDEX idx_content_moderation_logs_created_at ON content_moderation_logs (created_at DESC);
CREATE INDEX idx_content_moderation_logs_automated ON content_moderation_logs (is_automated);

-- Achievements table - Define available achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly name
    description TEXT NOT NULL,
    achievement_type achievement_type NOT NULL,
    
    -- Visual representation
    icon_url TEXT,
    badge_color VARCHAR(7), -- Hex color
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    
    -- Requirements and rewards
    requirements JSONB NOT NULL, -- JSON describing achievement requirements
    reward_mlg_tokens DECIMAL(20, 9) DEFAULT 0,
    reward_reputation INTEGER DEFAULT 0,
    
    -- Achievement properties
    is_hidden BOOLEAN DEFAULT FALSE, -- Hidden until earned
    is_repeatable BOOLEAN DEFAULT FALSE,
    max_completions INTEGER DEFAULT 1, -- -1 for unlimited
    
    -- Ordering and categorization
    display_order INTEGER DEFAULT 0,
    category VARCHAR(50),
    tags VARCHAR(25)[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_name_length CHECK (LENGTH(name) BETWEEN 3 AND 100),
    CONSTRAINT valid_slug CHECK (LENGTH(slug) BETWEEN 3 AND 100 AND slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_description_length CHECK (LENGTH(description) BETWEEN 10 AND 500),
    CONSTRAINT positive_rewards CHECK (reward_mlg_tokens >= 0 AND reward_reputation >= 0),
    CONSTRAINT valid_max_completions CHECK (max_completions = -1 OR max_completions > 0)
);

-- Create indexes for achievements table
CREATE INDEX idx_achievements_slug ON achievements (slug);
CREATE INDEX idx_achievements_type ON achievements (achievement_type);
CREATE INDEX idx_achievements_rarity ON achievements (rarity);
CREATE INDEX idx_achievements_active ON achievements (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_achievements_display_order ON achievements (display_order, name);
CREATE INDEX idx_achievements_category ON achievements (category) WHERE category IS NOT NULL;
CREATE INDEX idx_achievements_tags ON achievements USING GIN (tags);

-- Achievement progress table - Track user progress on achievements
CREATE TABLE achievement_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Progress tracking
    current_progress JSONB NOT NULL DEFAULT '{}', -- JSON tracking current progress
    completion_count INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Completion details
    first_completed_at TIMESTAMP WITH TIME ZONE,
    last_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Rewards claimed
    rewards_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id),
    CONSTRAINT positive_completion_count CHECK (completion_count >= 0),
    CONSTRAINT completion_consistency CHECK (
        (is_completed = FALSE AND first_completed_at IS NULL) OR
        (is_completed = TRUE AND first_completed_at IS NOT NULL)
    )
);

-- Create indexes for achievement progress table
CREATE INDEX idx_achievement_progress_user_id ON achievement_progress (user_id);
CREATE INDEX idx_achievement_progress_achievement_id ON achievement_progress (achievement_id);
CREATE INDEX idx_achievement_progress_completed ON achievement_progress (is_completed, first_completed_at);
CREATE INDEX idx_achievement_progress_updated_at ON achievement_progress (updated_at DESC);

-- User sessions table - Track user authentication sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Session details
    wallet_signature TEXT NOT NULL, -- Signature proving wallet ownership
    message_signed TEXT NOT NULL, -- Original message that was signed
    
    -- Network and device information
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Session timing
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoke_reason VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT future_expiry CHECK (expires_at > created_at),
    CONSTRAINT valid_session_token CHECK (LENGTH(session_token) >= 32),
    CONSTRAINT revocation_consistency CHECK (
        (is_active = TRUE AND revoked_at IS NULL) OR
        (is_active = FALSE AND revoked_at IS NOT NULL)
    )
);

-- Create indexes for user sessions table
CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions (session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions (is_active, expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_last_activity ON user_sessions (last_activity DESC);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions (expires_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_blockchain_transactions_updated_at BEFORE UPDATE ON blockchain_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clans_updated_at BEFORE UPDATE ON clans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clan_members_updated_at BEFORE UPDATE ON clan_members FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clan_invitations_updated_at BEFORE UPDATE ON clan_invitations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_voting_transactions_updated_at BEFORE UPDATE ON voting_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_voting_proposals_updated_at BEFORE UPDATE ON voting_proposals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_content_submissions_updated_at BEFORE UPDATE ON content_submissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_content_votes_updated_at BEFORE UPDATE ON content_votes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_achievement_progress_updated_at BEFORE UPDATE ON achievement_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for updating search vector on content submissions
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.game_title, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_submissions_search_vector 
    BEFORE INSERT OR UPDATE OF title, description, game_title, tags
    ON content_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_content_search_vector();

-- Create views for common queries

-- Active clan members view
CREATE VIEW active_clan_members AS
SELECT 
    cm.*,
    u.wallet_address,
    u.username,
    up.display_name,
    c.name as clan_name,
    c.tier as clan_tier
FROM clan_members cm
JOIN users u ON cm.user_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
JOIN clans c ON cm.clan_id = c.id
WHERE cm.is_active = TRUE AND u.status = 'active' AND c.status = 'active';

-- Content leaderboard view
CREATE VIEW content_leaderboard AS
SELECT 
    cs.*,
    u.wallet_address,
    u.username,
    up.display_name,
    c.name as clan_name,
    (cs.upvote_count - cs.downvote_count) as score,
    RANK() OVER (ORDER BY (cs.upvote_count - cs.downvote_count) DESC, cs.view_count DESC) as rank
FROM content_submissions cs
JOIN users u ON cs.user_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN clans c ON cs.clan_id = c.id
WHERE cs.status = 'approved' AND cs.visibility = 'public';

-- User stats view
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.wallet_address,
    u.username,
    up.display_name,
    u.total_votes_cast,
    u.total_mlg_burned,
    u.reputation_score,
    COUNT(DISTINCT cs.id) as content_count,
    COUNT(DISTINCT cm.clan_id) as clan_memberships,
    COUNT(DISTINCT ap.id) FILTER (WHERE ap.is_completed = TRUE) as achievements_earned,
    COALESCE(SUM(cs.upvote_count), 0) as total_upvotes_received,
    COALESCE(SUM(cs.view_count), 0) as total_views
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN content_submissions cs ON u.id = cs.user_id AND cs.status = 'approved'
LEFT JOIN clan_members cm ON u.id = cm.user_id AND cm.is_active = TRUE
LEFT JOIN achievement_progress ap ON u.id = ap.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.wallet_address, u.username, up.display_name, 
         u.total_votes_cast, u.total_mlg_burned, u.reputation_score;

-- Create RLS (Row Level Security) policies for multi-tenant security
-- Note: These would be enabled based on specific security requirements

-- Sample RLS policy for user data privacy
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_profiles_privacy ON user_profiles
--     USING (user_id = current_setting('app.current_user_id')::uuid OR 
--            EXISTS(SELECT 1 FROM users WHERE id = current_setting('app.current_user_id')::uuid AND status = 'active'));

-- Grant permissions to application role
-- Note: In production, create specific application roles with minimal required permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mlg_app_role;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO mlg_app_role;

-- Insert initial achievements
INSERT INTO achievements (name, slug, description, achievement_type, requirements, reward_mlg_tokens, reward_reputation, icon_url, rarity, category) VALUES
('First Vote', 'first-vote', 'Cast your first vote on community content', 'voting', '{"votes_cast": 1}', 1.0, 5, '/icons/achievements/first-vote.png', 'common', 'voting'),
('Vote Enthusiast', 'vote-enthusiast', 'Cast 100 votes on community content', 'voting', '{"votes_cast": 100}', 10.0, 50, '/icons/achievements/vote-enthusiast.png', 'uncommon', 'voting'),
('Content Creator', 'content-creator', 'Submit your first piece of content', 'content', '{"content_submitted": 1}', 2.0, 10, '/icons/achievements/content-creator.png', 'common', 'content'),
('Viral Content', 'viral-content', 'Get 1000 upvotes on a single piece of content', 'content', '{"single_content_upvotes": 1000}', 50.0, 200, '/icons/achievements/viral-content.png', 'rare', 'content'),
('Clan Founder', 'clan-founder', 'Create your first clan', 'clan', '{"clans_created": 1}', 5.0, 25, '/icons/achievements/clan-founder.png', 'uncommon', 'clan'),
('Social Butterfly', 'social-butterfly', 'Join 5 different clans', 'social', '{"clans_joined": 5}', 15.0, 75, '/icons/achievements/social-butterfly.png', 'rare', 'social');

-- Create database health check function
CREATE OR REPLACE FUNCTION db_health_check()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check table counts
    RETURN QUERY
    SELECT 
        'user_count'::TEXT,
        CASE WHEN count(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT,
        ('Total users: ' || count(*))::TEXT
    FROM users;
    
    RETURN QUERY
    SELECT 
        'active_clans'::TEXT,
        CASE WHEN count(*) >= 0 THEN 'OK' ELSE 'ERROR' END::TEXT,
        ('Active clans: ' || count(*))::TEXT
    FROM clans WHERE status = 'active';
    
    -- Check for expired sessions
    RETURN QUERY
    SELECT 
        'expired_sessions'::TEXT,
        CASE WHEN count(*) = 0 THEN 'OK' ELSE 'CLEANUP_NEEDED' END::TEXT,
        ('Expired sessions to cleanup: ' || count(*))::TEXT
    FROM user_sessions WHERE is_active = TRUE AND expires_at < NOW();
    
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- Cleanup expired sessions
    UPDATE user_sessions 
    SET is_active = FALSE, revoked_at = NOW(), revoke_reason = 'expired'
    WHERE is_active = TRUE AND expires_at < NOW();
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Cleanup expired clan invitations
    UPDATE clan_invitations 
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
    
    GET DIAGNOSTICS cleaned_count = cleaned_count + ROW_COUNT;
    
    -- Cleanup expired voting transactions
    -- Note: Keep historical records but mark as expired
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE mlg_clan IS 'MLG.clan gaming platform database with blockchain integration';
COMMENT ON TABLE users IS 'Core user accounts with Solana wallet integration';
COMMENT ON TABLE clans IS 'Gaming clans with MLG token staking and tier system';
COMMENT ON TABLE content_submissions IS 'User-generated gaming content with engagement tracking';
COMMENT ON TABLE voting_transactions IS 'MLG token burn transactions for additional votes';
COMMENT ON TABLE achievements IS 'Platform achievements and rewards system';

-- Database schema creation completed successfully
SELECT 'MLG.clan PostgreSQL schema created successfully!' as status;