-- =============================================
-- Kids Home Hub - Master Test Data Script
-- =============================================
-- Loads all test data in the correct order
-- Run this script to populate your Supabase database with test data
--
-- Usage:
-- 1. Deploy migrations first (in /supabase/migrations/)
-- 2. Run this script via Supabase SQL Editor or CLI
-- 3. Test users will be ready with full household data
--
-- =============================================

\echo '==========================================';
\echo 'Kids Home Hub - Loading Test Data';
\echo '==========================================';
\echo '';

-- =============================================
-- Step 1: Create Test Users
-- =============================================
\echo 'Step 1/5: Creating test users...';
\ir 001_test_users.sql
\echo 'Test users created successfully.';
\echo '';

-- =============================================
-- Step 2: Create Households and Children
-- =============================================
\echo 'Step 2/5: Creating households and children...';
\ir 002_households.sql
\echo 'Households and children created successfully.';
\echo '';

-- =============================================
-- Step 3: Create Chores
-- =============================================
\echo 'Step 3/5: Creating chores...';
\ir 003_chores.sql
\echo 'Chores created successfully.';
\echo '';

-- =============================================
-- Step 4: Create Chore Completions
-- =============================================
\echo 'Step 4/5: Creating chore completions...';
\ir 005_chore_completions.sql
\echo 'Chore completions created successfully.';
\echo '';

-- =============================================
-- Step 5: Create Transactions
-- =============================================
\echo 'Step 5/5: Creating transactions...';
\ir 004_transactions.sql
\echo 'Transactions created successfully.';
\echo '';

-- =============================================
-- Verification
-- =============================================
\echo '==========================================';
\echo 'Test Data Loaded Successfully!';
\echo '==========================================';
\echo '';
\echo 'Summary:';
\echo '--------';

-- Count users
SELECT 'Users created: ' || COUNT(*)::text FROM user_profiles;

-- Count households
SELECT 'Households created: ' || COUNT(*)::text FROM households;

-- Count children
SELECT 'Children created: ' || COUNT(*)::text FROM children;

-- Count chores (default + custom)
SELECT 'Chores created: ' || COUNT(*)::text FROM chores;

-- Count transactions
SELECT 'Transactions created: ' || COUNT(*)::text FROM transactions;

-- Count chore completions
SELECT 'Chore completions created: ' || COUNT(*)::text FROM chore_completions;

\echo '';
\echo 'Test User Accounts:';
\echo '-------------------';
\echo 'User 1: test1@kidshub.dev (Smith Family)';
\echo '  - Children: Emma (age 8), Noah (age 12)';
\echo '';
\echo 'User 2: test2@kidshub.dev (Johnson Family)';
\echo '  - Children: Olivia (age 10)';
\echo '';
\echo 'Default password (local dev only): password123';
\echo '';
\echo 'For production: Use Supabase Auth magic links or Dashboard to create users';
\echo '';

-- =============================================
-- Show Current Balances
-- =============================================
\echo 'Current Child Balances:';
\echo '-----------------------';

SELECT
  c.name AS child_name,
  h.name AS household,
  c.money_total AS money,
  c.points_total AS points,
  c.screen_total AS screen_time_min
FROM children c
JOIN households h ON h.id = c.household_id
ORDER BY h.name, c.display_order;

\echo '';
\echo '==========================================';
\echo 'Setup Complete!';
\echo '==========================================';
\echo '';
\echo 'Next Steps:';
\echo '1. Sign in via Supabase Auth with test emails';
\echo '2. Magic links will create auth.users entries';
\echo '3. Trigger will link to existing user_profiles';
\echo '4. Test the application with realistic data';
\echo '';

-- =============================================
-- Notes
-- =============================================
-- The test data includes:
-- - 2 test users (Smith and Johnson families)
-- - 2 households with 3 children total
-- - Default chores + custom chores for each household
-- - 2 weeks of transaction history
-- - 2 weeks of chore completion history
-- - Realistic balances for money, points, and screen time
--
-- All triggers are active, so:
-- - New transactions will update child totals
-- - New chore completions will update points
-- - New households will auto-create members and default chores
-- =============================================
