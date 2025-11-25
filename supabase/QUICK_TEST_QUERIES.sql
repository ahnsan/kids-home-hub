-- ============================================================================
-- Kids Home Hub - Quick Test Queries
-- ============================================================================
--
-- Use these queries to test your database setup and understand the data model.
-- Run these in the Supabase SQL Editor after applying migrations.
--
-- ============================================================================

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- 1. Check all tables exist
SELECT
  'Tables Check' AS test,
  COUNT(*) AS found,
  8 AS expected,
  CASE WHEN COUNT(*) = 8 THEN '✓ PASS' ELSE '✗ FAIL' END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'user_sessions', 'households', 'household_members',
    'children', 'chores', 'transactions', 'chore_completions'
  );

-- 2. Check RLS is enabled on all tables
SELECT
  'RLS Check' AS test,
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ Disabled' END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'user_sessions', 'households', 'household_members',
    'children', 'chores', 'transactions', 'chore_completions'
  )
ORDER BY tablename;

-- 3. Count policies per table
SELECT
  'Policy Count' AS test,
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. List all functions
SELECT
  'Functions' AS test,
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f'
ORDER BY proname;

-- 5. List all triggers
SELECT
  'Triggers' AS test,
  tgrelid::regclass AS table_name,
  tgname AS trigger_name
FROM pg_trigger
WHERE tgname NOT LIKE 'RI_%'
  AND tgname NOT LIKE 'pg_%'
  AND tgisinternal = false
ORDER BY tgrelid::regclass, tgname;

-- =============================================================================
-- DATA INSPECTION QUERIES
-- =============================================================================

-- 6. View all users (should be empty initially)
SELECT
  'Users' AS table_name,
  COUNT(*) AS row_count,
  CASE WHEN COUNT(*) = 0 THEN 'Empty (expected)' ELSE 'Has data' END AS status
FROM users;

-- 7. View all households (should be empty initially)
SELECT
  'Households' AS table_name,
  COUNT(*) AS row_count,
  CASE WHEN COUNT(*) = 0 THEN 'Empty (expected)' ELSE 'Has data' END AS status
FROM households;

-- 8. View all children (should be empty initially)
SELECT
  'Children' AS table_name,
  COUNT(*) AS row_count,
  CASE WHEN COUNT(*) = 0 THEN 'Empty (expected)' ELSE 'Has data' END AS status
FROM children;

-- 9. View all chores (should be empty initially)
SELECT
  'Chores' AS table_name,
  COUNT(*) AS row_count,
  CASE WHEN COUNT(*) = 0 THEN 'Empty (expected)' ELSE 'Has data' END AS status
FROM chores;

-- =============================================================================
-- TEST DATA CREATION (OPTIONAL)
-- =============================================================================

-- NOTE: These queries create test data. Only run if you want to test the schema.
-- Comment out by default to avoid accidental execution.

/*
-- Create a test user (normally done via Supabase Auth)
-- This requires a valid auth.users entry, so we'll skip this in favor of Auth-based signup

-- If you want to test manually, you can insert test data:

-- 1. First, sign up a user via Supabase Auth UI or API
-- 2. Then run this to create a household:

-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from auth.users
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE'::UUID;
  test_household_id UUID;
BEGIN
  -- Create household (this will auto-add owner and default chores)
  test_household_id := create_household(
    test_user_id,
    'Test Family',
    'GBP'
  );

  RAISE NOTICE 'Created household: %', test_household_id;
END $$;
*/

-- =============================================================================
-- FUNCTION TESTING
-- =============================================================================

-- Test create_default_chores function
-- (Normally called automatically when creating a household)
/*
DO $$
DECLARE
  test_household_id UUID := gen_random_uuid();
BEGIN
  -- First create a dummy household
  INSERT INTO households (id, name, created_by)
  VALUES (test_household_id, 'Test Household', 'YOUR_USER_ID_HERE'::UUID);

  -- Create default chores
  PERFORM create_default_chores(test_household_id);

  -- View the chores
  RAISE NOTICE 'Created % chores',
    (SELECT COUNT(*) FROM chores WHERE household_id = test_household_id);
END $$;

-- Check created chores
SELECT * FROM chores WHERE is_default = TRUE;
*/

-- =============================================================================
-- SCHEMA INSPECTION
-- =============================================================================

-- 10. View users table structure
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 11. View children table structure (with balance columns)
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'children'
ORDER BY ordinal_position;

-- 12. View transactions table structure
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
ORDER BY ordinal_position;

-- =============================================================================
-- CONSTRAINT INSPECTION
-- =============================================================================

-- 13. View all foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 14. View all check constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =============================================================================
-- INDEX INSPECTION
-- =============================================================================

-- 15. View all indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- POLICY DETAILS
-- =============================================================================

-- 16. View detailed policy information
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- AUTH TRIGGER CHECK
-- =============================================================================

-- 17. Check auth triggers are installed
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  tgenabled AS enabled,
  CASE tgtype::int
    WHEN 2 THEN 'BEFORE'
    WHEN 4 THEN 'AFTER'
    ELSE 'OTHER'
  END AS timing,
  CASE tgtype::int & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE'
    WHEN 16 THEN 'UPDATE'
    WHEN 20 THEN 'INSERT OR UPDATE'
    WHEN 28 THEN 'INSERT OR DELETE OR UPDATE'
    ELSE 'OTHER'
  END AS events
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname IN ('on_auth_user_created', 'on_auth_user_updated')
ORDER BY tgname;

-- =============================================================================
-- SUMMARY
-- =============================================================================

SELECT '═══════════════════════════════════════' AS separator;
SELECT 'DATABASE STRUCTURE SUMMARY' AS title;
SELECT '═══════════════════════════════════════' AS separator;

SELECT
  'Tables' AS component,
  COUNT(*) AS count
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT
  'RLS Policies' AS component,
  COUNT(*) AS count
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Functions' AS component,
  COUNT(*) AS count
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace AND prokind = 'f'
UNION ALL
SELECT
  'Triggers' AS component,
  COUNT(*) AS count
FROM pg_trigger
WHERE tgname NOT LIKE 'RI_%' AND tgname NOT LIKE 'pg_%' AND tgisinternal = false
UNION ALL
SELECT
  'Indexes' AS component,
  COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
UNION ALL
SELECT
  'Foreign Keys' AS component,
  COUNT(*) AS count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY';

SELECT '═══════════════════════════════════════' AS separator;
