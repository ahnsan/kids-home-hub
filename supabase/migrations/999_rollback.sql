-- Kids Home Hub - Rollback Script
-- WARNING: This script will DROP ALL tables, functions, triggers, and views
-- USE WITH EXTREME CAUTION - ALL DATA WILL BE LOST
--
-- Only run this if you need to completely reset the database
-- and start fresh with the migrations.

-- =============================================================================
-- BACKUP REMINDER
-- =============================================================================

-- ⚠️ STOP! BEFORE RUNNING THIS SCRIPT:
-- 1. Create a full database backup
-- 2. Export critical data
-- 3. Verify you have the backup
-- 4. Are you absolutely sure you want to proceed?

-- Uncomment the following line to proceed (safety check):
-- SET LOCAL client_min_messages TO WARNING;

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'WARNING: ROLLBACK SCRIPT';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE 'This script will DELETE ALL TABLES, VIEWS, FUNCTIONS, and TRIGGERS!';
  RAISE NOTICE 'ALL DATA WILL BE PERMANENTLY LOST!';
  RAISE NOTICE '';
  RAISE NOTICE 'To proceed, you must uncomment the DROP statements below.';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- Uncomment the sections below ONLY if you really want to rollback

-- =============================================================================
-- DROP VIEWS
-- =============================================================================

/*
DROP VIEW IF EXISTS transaction_summary CASCADE;
DROP VIEW IF EXISTS user_households CASCADE;
DROP VIEW IF EXISTS chore_popularity CASCADE;
DROP VIEW IF EXISTS monthly_leaderboard CASCADE;
DROP VIEW IF EXISTS weekly_leaderboard CASCADE;
DROP VIEW IF EXISTS recent_chore_completions CASCADE;
DROP VIEW IF EXISTS recent_transactions CASCADE;
DROP VIEW IF EXISTS household_members_detailed CASCADE;
DROP VIEW IF EXISTS child_balances CASCADE;
DROP VIEW IF EXISTS household_summary CASCADE;
*/

-- =============================================================================
-- DROP TRIGGERS (from auth.users)
-- =============================================================================

/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
*/

-- =============================================================================
-- DROP TRIGGERS (from application tables)
-- =============================================================================

/*
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_households_updated_at ON households;
DROP TRIGGER IF EXISTS update_children_updated_at ON children;
DROP TRIGGER IF EXISTS update_chores_updated_at ON chores;

DROP TRIGGER IF EXISTS on_household_created ON households;
DROP TRIGGER IF EXISTS check_last_owner_delete ON household_members;
DROP TRIGGER IF EXISTS check_last_owner_update ON household_members;
DROP TRIGGER IF EXISTS validate_balances_insert ON children;
DROP TRIGGER IF EXISTS validate_balances_update ON children;
DROP TRIGGER IF EXISTS set_chore_week_start ON chore_completions;
*/

-- =============================================================================
-- DROP FUNCTIONS
-- =============================================================================

/*
-- Auth trigger functions
DROP FUNCTION IF EXISTS handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS handle_auth_user_updated() CASCADE;
DROP FUNCTION IF EXISTS handle_auth_user_deleted() CASCADE;

-- Household trigger functions
DROP FUNCTION IF EXISTS handle_household_created() CASCADE;
DROP FUNCTION IF EXISTS prevent_last_owner_removal() CASCADE;

-- Child trigger functions
DROP FUNCTION IF EXISTS validate_child_balances() CASCADE;

-- Chore trigger functions
DROP FUNCTION IF EXISTS set_week_start() CASCADE;

-- Helper functions
DROP FUNCTION IF EXISTS get_or_create_user(UUID, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS create_household(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_default_chores(UUID) CASCADE;
DROP FUNCTION IF EXISTS add_household_member(UUID, UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS add_child(UUID, TEXT, TEXT, DATE) CASCADE;

-- Transaction functions
DROP FUNCTION IF EXISTS complete_chore(UUID, UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS adjust_money(UUID, DECIMAL, TEXT, TEXT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS adjust_screen_time(UUID, INTEGER, TEXT, TEXT, UUID) CASCADE;

-- Cleanup functions
DROP FUNCTION IF EXISTS cleanup_old_sessions(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS archive_old_transactions(INTEGER) CASCADE;

-- Analytics functions
DROP FUNCTION IF EXISTS get_child_weekly_stats(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_household_leaderboard(UUID, TEXT) CASCADE;

-- Update trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_session_activity() CASCADE;
*/

-- =============================================================================
-- DISABLE ROW LEVEL SECURITY
-- =============================================================================

/*
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS households DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS children DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chore_completions DISABLE ROW LEVEL SECURITY;
*/

-- =============================================================================
-- DROP POLICIES
-- =============================================================================

-- Note: Policies are automatically dropped when tables are dropped
-- This section is just for reference

/*
-- Users policies
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_select_household_members ON users;

-- Sessions policies
DROP POLICY IF EXISTS sessions_select_own ON user_sessions;
DROP POLICY IF EXISTS sessions_insert_own ON user_sessions;
DROP POLICY IF EXISTS sessions_update_own ON user_sessions;
DROP POLICY IF EXISTS sessions_delete_own ON user_sessions;

-- Households policies
DROP POLICY IF EXISTS households_select_member ON households;
DROP POLICY IF EXISTS households_insert_authenticated ON households;
DROP POLICY IF EXISTS households_update_owner ON households;
DROP POLICY IF EXISTS households_delete_owner ON households;

-- Household members policies
DROP POLICY IF EXISTS household_members_select_same_household ON household_members;
DROP POLICY IF EXISTS household_members_insert_owner_parent ON household_members;
DROP POLICY IF EXISTS household_members_update_owner ON household_members;
DROP POLICY IF EXISTS household_members_delete_owner_or_self ON household_members;

-- Children policies
DROP POLICY IF EXISTS children_select_household_member ON children;
DROP POLICY IF EXISTS children_insert_owner_parent ON children;
DROP POLICY IF EXISTS children_update_owner_parent ON children;
DROP POLICY IF EXISTS children_delete_owner_parent ON children;

-- Chores policies
DROP POLICY IF EXISTS chores_select_household_member ON chores;
DROP POLICY IF EXISTS chores_insert_owner_parent ON chores;
DROP POLICY IF EXISTS chores_update_owner_parent ON chores;
DROP POLICY IF EXISTS chores_delete_owner_parent ON chores;

-- Transactions policies
DROP POLICY IF EXISTS transactions_select_household_member ON transactions;
DROP POLICY IF EXISTS transactions_insert_owner_parent ON transactions;
DROP POLICY IF EXISTS transactions_update_own ON transactions;
DROP POLICY IF EXISTS transactions_delete_own_recent ON transactions;

-- Chore completions policies
DROP POLICY IF EXISTS chore_completions_select_household_member ON chore_completions;
DROP POLICY IF EXISTS chore_completions_insert_owner_parent ON chore_completions;
DROP POLICY IF EXISTS chore_completions_update_own ON chore_completions;
DROP POLICY IF EXISTS chore_completions_delete_own_recent ON chore_completions;
*/

-- =============================================================================
-- DROP TABLES
-- =============================================================================

-- Drop in reverse dependency order

/*
DROP TABLE IF EXISTS chore_completions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS chores CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
*/

-- =============================================================================
-- DROP EXTENSIONS (optional - usually keep these)
-- =============================================================================

-- Uncomment only if you want to remove extensions too
-- Note: Other databases might be using these extensions

/*
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- DROP EXTENSION IF EXISTS "uuid-ossp";
*/

-- =============================================================================
-- VERIFICATION
-- =============================================================================

/*
-- After rollback, verify everything is gone
SELECT
  'Tables remaining: ' || COUNT(*)::TEXT AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

SELECT
  'Views remaining: ' || COUNT(*)::TEXT AS status
FROM pg_views
WHERE schemaname = 'public';

SELECT
  'Functions remaining: ' || COUNT(*)::TEXT AS status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f';

SELECT
  'Triggers remaining: ' || COUNT(*)::TEXT AS status
FROM pg_trigger
WHERE tgname NOT LIKE 'pg_%'
  AND tgname NOT LIKE 'RI_%';
*/

-- =============================================================================
-- NEXT STEPS AFTER ROLLBACK
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'ROLLBACK COMPLETE (if uncommented)';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run migrations in order:';
  RAISE NOTICE '   - 001_initial_schema.sql';
  RAISE NOTICE '   - 002_rls_policies.sql';
  RAISE NOTICE '   - 003_helper_functions.sql';
  RAISE NOTICE '   - 004_triggers.sql';
  RAISE NOTICE '   - 005_views.sql';
  RAISE NOTICE '';
  RAISE NOTICE '2. Restore data from backup (if applicable)';
  RAISE NOTICE '3. Test authentication';
  RAISE NOTICE '4. Test RLS policies';
  RAISE NOTICE '5. Verify application functionality';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
