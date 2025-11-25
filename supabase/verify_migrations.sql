-- ============================================================================
-- Kids Home Hub - Database Verification Script
-- ============================================================================
--
-- This script verifies that all database migrations have been applied correctly.
-- Run this after executing APPLY_MIGRATIONS.sql to confirm successful setup.
--
-- INSTRUCTIONS:
-- 1. Log in to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire script
-- 5. Click "Run" to execute
-- 6. Review the results - all checks should pass
--
-- ============================================================================

-- =============================================================================
-- 1. CHECK EXTENSIONS
-- =============================================================================

SELECT
  '1. Extensions' AS check_category,
  CASE
    WHEN COUNT(*) >= 2 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  2 AS expected,
  STRING_AGG(extname, ', ') AS extensions
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- =============================================================================
-- 2. CHECK TABLES
-- =============================================================================

SELECT
  '2. Tables' AS check_category,
  CASE
    WHEN COUNT(*) = 8 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  8 AS expected,
  STRING_AGG(tablename, ', ' ORDER BY tablename) AS tables
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'user_sessions',
    'households',
    'household_members',
    'children',
    'chores',
    'transactions',
    'chore_completions'
  );

-- =============================================================================
-- 3. CHECK INDIVIDUAL TABLES
-- =============================================================================

SELECT
  '3. Table Details' AS check_category,
  tablename AS table_name,
  CASE
    WHEN tablename IN (
      'users', 'user_sessions', 'households', 'household_members',
      'children', 'chores', 'transactions', 'chore_completions'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'user_sessions',
    'households',
    'household_members',
    'children',
    'chores',
    'transactions',
    'chore_completions'
  )
ORDER BY tablename;

-- =============================================================================
-- 4. CHECK ROW LEVEL SECURITY
-- =============================================================================

SELECT
  '4. RLS Enabled' AS check_category,
  tablename AS table_name,
  CASE
    WHEN rowsecurity THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'user_sessions',
    'households',
    'household_members',
    'children',
    'chores',
    'transactions',
    'chore_completions'
  )
ORDER BY tablename;

-- =============================================================================
-- 5. CHECK RLS POLICIES
-- =============================================================================

SELECT
  '5. RLS Policies' AS check_category,
  CASE
    WHEN COUNT(*) >= 30 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  '30+' AS expected,
  'Policies across all tables' AS description
FROM pg_policies
WHERE schemaname = 'public';

-- Detailed policy breakdown by table
SELECT
  '5a. Policies by Table' AS check_category,
  tablename AS table_name,
  COUNT(*) AS policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- 6. CHECK INDEXES
-- =============================================================================

SELECT
  '6. Indexes' AS check_category,
  CASE
    WHEN COUNT(*) >= 20 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  '20+' AS expected,
  'Performance indexes created' AS description
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%pkey';

-- =============================================================================
-- 7. CHECK FUNCTIONS
-- =============================================================================

SELECT
  '7. Functions' AS check_category,
  CASE
    WHEN COUNT(*) >= 10 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  '10+' AS expected,
  STRING_AGG(proname, ', ' ORDER BY proname) AS functions
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f'
  AND proname IN (
    'get_or_create_user',
    'create_household',
    'create_default_chores',
    'complete_chore',
    'adjust_money',
    'adjust_screen_time',
    'update_updated_at_column',
    'handle_auth_user_created',
    'handle_auth_user_updated',
    'handle_household_created',
    'prevent_last_owner_removal',
    'validate_child_balances',
    'set_week_start'
  );

-- =============================================================================
-- 8. CHECK TRIGGERS
-- =============================================================================

SELECT
  '8. Triggers' AS check_category,
  CASE
    WHEN COUNT(*) >= 10 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  '10+' AS expected,
  'Active triggers' AS description
FROM pg_trigger
WHERE tgname NOT LIKE 'RI_%'  -- Exclude internal FK triggers
  AND tgname NOT LIKE 'pg_%'   -- Exclude system triggers
  AND tgisinternal = false;

-- Detailed trigger breakdown
SELECT
  '8a. Triggers by Table' AS check_category,
  tgrelid::regclass AS table_name,
  COUNT(*) AS trigger_count,
  STRING_AGG(tgname, ', ' ORDER BY tgname) AS triggers
FROM pg_trigger
WHERE tgname NOT LIKE 'RI_%'
  AND tgname NOT LIKE 'pg_%'
  AND tgisinternal = false
GROUP BY tgrelid::regclass
ORDER BY tgrelid::regclass;

-- =============================================================================
-- 9. CHECK FOREIGN KEYS
-- =============================================================================

SELECT
  '9. Foreign Keys' AS check_category,
  CASE
    WHEN COUNT(*) >= 10 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  '10+' AS expected,
  'Relational integrity constraints' AS description
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';

-- =============================================================================
-- 10. CHECK CHECK CONSTRAINTS
-- =============================================================================

SELECT
  '10. Check Constraints' AS check_category,
  CASE
    WHEN COUNT(*) >= 8 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  '8+' AS expected,
  'Data validation constraints' AS description
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'CHECK';

-- =============================================================================
-- 11. CHECK KEY COLUMNS
-- =============================================================================

-- Verify users table structure
SELECT
  '11. Users Columns' AS check_category,
  CASE
    WHEN COUNT(*) >= 7 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  7 AS expected,
  STRING_AGG(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users';

-- Verify children table structure
SELECT
  '11a. Children Columns' AS check_category,
  CASE
    WHEN COUNT(*) >= 11 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  11 AS expected,
  STRING_AGG(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'children';

-- Verify transactions table structure
SELECT
  '11b. Transactions Columns' AS check_category,
  CASE
    WHEN COUNT(*) >= 10 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(*) AS found,
  10 AS expected,
  STRING_AGG(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions';

-- =============================================================================
-- 12. CHECK AUTH TRIGGERS
-- =============================================================================

SELECT
  '12. Auth Triggers' AS check_category,
  tgname AS trigger_name,
  tgrelid::regclass AS on_table,
  CASE
    WHEN tgname IN ('on_auth_user_created', 'on_auth_user_updated') THEN '✓ EXISTS'
    ELSE '? UNKNOWN'
  END AS status
FROM pg_trigger
WHERE tgname IN ('on_auth_user_created', 'on_auth_user_updated')
ORDER BY tgname;

-- =============================================================================
-- 13. SUMMARY REPORT
-- =============================================================================

SELECT
  '═══════════════════════════════════════════════════════════' AS separator;

SELECT
  'VERIFICATION SUMMARY' AS report_title,
  NOW() AS verification_time;

SELECT
  '═══════════════════════════════════════════════════════════' AS separator;

-- Overall status
WITH verification_checks AS (
  SELECT
    COUNT(*) AS total_checks,
    SUM(CASE
      WHEN (
        -- Extensions check
        (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto')) >= 2
        AND
        -- Tables check
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
          AND tablename IN ('users', 'user_sessions', 'households', 'household_members',
                           'children', 'chores', 'transactions', 'chore_completions')) = 8
        AND
        -- RLS policies check
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 30
        AND
        -- Functions check
        (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prokind = 'f') >= 10
        AND
        -- Triggers check
        (SELECT COUNT(*) FROM pg_trigger WHERE tgname NOT LIKE 'RI_%' AND tgname NOT LIKE 'pg_%' AND tgisinternal = false) >= 10
      ) THEN 1 ELSE 0 END
    ) AS passed_checks
  FROM generate_series(1, 1)
)
SELECT
  'Overall Status' AS check_type,
  CASE
    WHEN passed_checks = total_checks THEN '✓✓✓ ALL CHECKS PASSED ✓✓✓'
    ELSE '✗✗✗ SOME CHECKS FAILED ✗✗✗'
  END AS status,
  passed_checks || ' / ' || total_checks AS score
FROM verification_checks;

SELECT
  '═══════════════════════════════════════════════════════════' AS separator;

-- =============================================================================
-- 14. NEXT STEPS
-- =============================================================================

SELECT
  'NEXT STEPS' AS section,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
          AND tablename IN ('users', 'user_sessions', 'households', 'household_members',
                           'children', 'chores', 'transactions', 'chore_completions')) = 8
    THEN 'All migrations applied successfully! You can now:'
    ELSE 'Some tables are missing. Please run APPLY_MIGRATIONS.sql first.'
  END AS message;

SELECT
  '1' AS step,
  'Update backend environment variables with Supabase credentials' AS action;

SELECT
  '2' AS step,
  'Test authentication with Supabase Auth' AS action;

SELECT
  '3' AS step,
  'Run backend tests to verify integration' AS action;

SELECT
  '4' AS step,
  'Deploy backend to production environment' AS action;

SELECT
  '═══════════════════════════════════════════════════════════' AS separator;
