-- Migration 001: Initial Schema Creation
-- MLG.clan Platform Database Migration
-- Created: 2025-08-10
-- Description: Creates the initial database schema with all core tables and indexes

-- Migration metadata
INSERT INTO schema_migrations (version, description, executed_at) 
VALUES ('001', 'Initial schema creation', NOW())
ON CONFLICT (version) DO NOTHING;

-- This migration applies the full initial schema
-- The actual schema is in postgresql-schema.sql
-- This file serves as a migration record

-- Verify all core tables exist
DO $$
BEGIN
    -- Check that all required tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Migration failed: users table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clans') THEN
        RAISE EXCEPTION 'Migration failed: clans table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_submissions') THEN
        RAISE EXCEPTION 'Migration failed: content_submissions table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voting_transactions') THEN
        RAISE EXCEPTION 'Migration failed: voting_transactions table not created';
    END IF;
    
    -- Log successful verification
    RAISE NOTICE 'Migration 001 verification passed - all core tables exist';
END $$;