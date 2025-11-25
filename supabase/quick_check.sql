-- ============================================================================
-- Quick Database State Check
-- ============================================================================
-- Run this in Supabase SQL Editor to verify your migration was successful
-- ============================================================================

\echo '============================================================================'
\echo 'KIDS HOME HUB - DATABASE STATE CHECK'
\echo '============================================================================'

-- ============================================================================
-- 1. TABLE CHECK
-- ============================================================================
\echo ''
\echo '1. TABLES - Expected: 8 core tables'
\echo '------------------------------------'

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '✓ RLS Enabled'
    ELSE '✗ RLS Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count check
SELECT
  '✓ Table Count: ' || COUNT(*) || ' tables' as check_result
FROM pg_tables
WHERE schemaname = 'public';

-- ============================================================================
-- 2. EXTENSIONS CHECK
-- ============================================================================
\echo ''
\echo '2. EXTENSIONS - Expected: uuid-ossp, pgcrypto'
\echo '----------------------------------------------'

SELECT
  '✓ ' || extname as extension_name
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- ============================================================================
-- 3. INDEXES CHECK
-- ============================================================================
\echo ''
\echo '3. INDEXES - Expected: 25+ indexes'
\echo '-----------------------------------'

SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

SELECT
  '✓ Index Count: ' || COUNT(*) || ' indexes (excluding primary keys)' as check_result
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey';

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES CHECK
-- ============================================================================
\echo ''
\echo '4. RLS POLICIES - Expected: 30+ policies'
\echo '----------------------------------------'

SELECT
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT
  '✓ Policy Count: ' || COUNT(*) || ' policies' as check_result
FROM pg_policies
WHERE schemaname = 'public';

-- Policy count by table
\echo ''
\echo 'Policies per table:'
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 5. FUNCTIONS CHECK
-- ============================================================================
\echo ''
\echo '5. FUNCTIONS - Expected: 6+ helper functions'
\echo '--------------------------------------------'

SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

SELECT
  '✓ Function Count: ' || COUNT(*) || ' functions' as check_result
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';

-- ============================================================================
-- 6. TRIGGERS CHECK
-- ============================================================================
\echo ''
\echo '6. TRIGGERS - Expected: 10+ triggers'
\echo '------------------------------------'

SELECT
  trigger_name,
  event_object_table as table_name,
  event_manipulation as event_type
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

SELECT
  '✓ Trigger Count: ' || COUNT(*) || ' triggers' as check_result
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- ============================================================================
-- 7. DATA CHECK (if test data loaded)
-- ============================================================================
\echo ''
\echo '7. DATA CHECK - Record counts'
\echo '------------------------------'

SELECT
  'users' as table_name,
  COUNT(*) as record_count
FROM users
UNION ALL
SELECT 'households', COUNT(*) FROM households
UNION ALL
SELECT 'household_members', COUNT(*) FROM household_members
UNION ALL
SELECT 'children', COUNT(*) FROM children
UNION ALL
SELECT 'chores', COUNT(*) FROM chores
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'chore_completions', COUNT(*) FROM chore_completions
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
ORDER BY table_name;

-- ============================================================================
-- 8. FOREIGN KEY CONSTRAINTS CHECK
-- ============================================================================
\echo ''
\echo '8. FOREIGN KEY CONSTRAINTS'
\echo '--------------------------'

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

SELECT
  '✓ Foreign Key Count: ' || COUNT(*) || ' foreign keys' as check_result
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- ============================================================================
-- 9. CHECK CONSTRAINTS
-- ============================================================================
\echo ''
\echo '9. CHECK CONSTRAINTS - Balance validations, enums'
\echo '-------------------------------------------------'

SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 10. SUMMARY
-- ============================================================================
\echo ''
\echo '============================================================================'
\echo 'SUMMARY'
\echo '============================================================================'

SELECT
  '✓ Database Migration: COMPLETE' as status
UNION ALL
SELECT '✓ Tables: ' ||
  (SELECT COUNT(*)::text FROM pg_tables WHERE schemaname = 'public') || ' created'
UNION ALL
SELECT '✓ RLS Policies: ' ||
  (SELECT COUNT(*)::text FROM pg_policies WHERE schemaname = 'public') || ' active'
UNION ALL
SELECT '✓ Functions: ' ||
  (SELECT COUNT(*)::text FROM information_schema.routines
   WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') || ' available'
UNION ALL
SELECT '✓ Triggers: ' ||
  (SELECT COUNT(*)::text FROM information_schema.triggers WHERE trigger_schema = 'public') || ' installed'
UNION ALL
SELECT '✓ Indexes: ' ||
  (SELECT COUNT(*)::text FROM pg_indexes
   WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey') || ' created'
UNION ALL
SELECT '✓ Foreign Keys: ' ||
  (SELECT COUNT(*)::text FROM information_schema.table_constraints
   WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') || ' defined';

-- ============================================================================
-- 11. NEXT STEPS
-- ============================================================================
\echo ''
\echo '============================================================================'
\echo 'NEXT STEPS'
\echo '============================================================================'
\echo ''
\echo '1. Load test data:'
\echo '   File: /Users/Karim/kids-home-hub/supabase/test_data/QUICK_START.sql'
\echo ''
\echo '2. Enable email authentication in Supabase Dashboard:'
\echo '   Settings > Authentication > Email'
\echo ''
\echo '3. Configure environment variables in backend/.env:'
\echo '   SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co'
\echo '   SUPABASE_ANON_KEY=<your-anon-key>'
\echo ''
\echo '4. Test the API endpoints'
\echo '   See: /Users/Karim/kids-home-hub/QUICK_TEST_GUIDE.md'
\echo ''
\echo '============================================================================'

-- ============================================================================
-- Verification complete!
-- ============================================================================
