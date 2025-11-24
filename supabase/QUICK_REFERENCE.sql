-- Kids Home Hub - SQL Quick Reference
-- Common queries and operations for the Supabase database

-- =============================================================================
-- TABLE OF CONTENTS
-- =============================================================================
-- 1. User Management
-- 2. Household Management
-- 3. Child Management
-- 4. Chore Management
-- 5. Transaction Management
-- 6. Analytics & Reports
-- 7. Maintenance & Cleanup

-- =============================================================================
-- 1. USER MANAGEMENT
-- =============================================================================

-- Get current authenticated user
SELECT * FROM users WHERE id = auth.uid();

-- Get user's profile with email verification
SELECT
  id,
  email,
  email_verified,
  display_name,
  avatar_url,
  created_at
FROM users
WHERE id = auth.uid();

-- Update user profile
UPDATE users
SET
  display_name = 'John Smith',
  avatar_url = 'https://example.com/avatar.jpg'
WHERE id = auth.uid();

-- Get user's active sessions
SELECT
  device_name,
  device_type,
  last_active_at,
  created_at
FROM user_sessions
WHERE user_id = auth.uid()
ORDER BY last_active_at DESC;

-- =============================================================================
-- 2. HOUSEHOLD MANAGEMENT
-- =============================================================================

-- Get all households user belongs to
SELECT * FROM user_households WHERE user_id = auth.uid();

-- Get detailed household info
SELECT
  h.id,
  h.name,
  h.currency,
  h.timezone,
  hs.member_count,
  hs.active_children_count,
  hs.active_chores_count
FROM households h
JOIN household_summary hs ON hs.household_id = h.id
WHERE h.id = 'household-id-here';

-- Create a new household (with owner setup and default chores)
SELECT create_household(
  auth.uid(),
  'Smith Family',
  'GBP'
) AS new_household_id;

-- Update household settings
UPDATE households
SET
  name = 'The Smith Family',
  currency = 'USD',
  timezone = 'America/New_York'
WHERE id = 'household-id-here'
  AND id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND role = 'owner'
  );

-- Get household members with details
SELECT
  email,
  display_name,
  role,
  invitation_status,
  joined_at
FROM household_members_detailed
WHERE household_id = 'household-id-here'
ORDER BY
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'parent' THEN 2
    WHEN 'viewer' THEN 3
  END,
  joined_at;

-- Add member to household
SELECT add_household_member(
  'household-id-here'::UUID,
  'new-user-id-here'::UUID,
  'parent',  -- role: 'owner', 'parent', or 'viewer'
  auth.uid()  -- inviter
) AS new_member_id;

-- Update member role (owner only)
UPDATE household_members
SET role = 'viewer'
WHERE household_id = 'household-id-here'
  AND user_id = 'member-user-id-here'
  AND household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND role = 'owner'
  );

-- Remove member from household (owner only, or self)
DELETE FROM household_members
WHERE household_id = 'household-id-here'
  AND user_id = 'member-user-id-here';

-- Leave household (remove self)
DELETE FROM household_members
WHERE household_id = 'household-id-here'
  AND user_id = auth.uid();

-- Delete household (owner only)
DELETE FROM households
WHERE id = 'household-id-here';

-- =============================================================================
-- 3. CHILD MANAGEMENT
-- =============================================================================

-- Get all children in household with balances
SELECT
  id,
  name,
  avatar,
  money_total,
  points_total,
  screen_total,
  chores_this_week,
  points_this_week,
  display_order
FROM child_balances
WHERE household_id = 'household-id-here'
ORDER BY display_order;

-- Get single child details
SELECT * FROM child_balances WHERE id = 'child-id-here';

-- Add a child
SELECT add_child(
  'household-id-here'::UUID,
  'Emma',
  '👧',
  '2015-03-15'::DATE
) AS new_child_id;

-- Update child profile
UPDATE children
SET
  name = 'Emma Smith',
  avatar = '👧',
  date_of_birth = '2015-03-15'
WHERE id = 'child-id-here'
  AND household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
  );

-- Update child display order
UPDATE children
SET display_order = 1
WHERE id = 'child-id-here';

-- Archive child (soft delete)
UPDATE children
SET is_archived = TRUE
WHERE id = 'child-id-here';

-- Unarchive child
UPDATE children
SET is_archived = FALSE
WHERE id = 'child-id-here';

-- Delete child permanently
DELETE FROM children
WHERE id = 'child-id-here';

-- Get child's weekly stats (last 4 weeks)
SELECT * FROM get_child_weekly_stats('child-id-here'::UUID, 4);

-- =============================================================================
-- 4. CHORE MANAGEMENT
-- =============================================================================

-- Get all chores in household
SELECT
  id,
  label,
  description,
  points,
  icon,
  category,
  is_default,
  is_archived
FROM chores
WHERE household_id = 'household-id-here'
  AND is_archived = FALSE
ORDER BY category, label;

-- Get chores by category
SELECT * FROM chores
WHERE household_id = 'household-id-here'
  AND category = 'cleaning'
  AND is_archived = FALSE;

-- Get chore popularity stats
SELECT * FROM chore_popularity
WHERE household_id = 'household-id-here'
ORDER BY total_completions DESC;

-- Create default chores (automatically done on household creation)
SELECT create_default_chores('household-id-here'::UUID);

-- Create custom chore
INSERT INTO chores (household_id, label, points, icon, category, description)
VALUES (
  'household-id-here',
  'Water the plants',
  5,
  '🌱',
  'helping',
  'Water all plants in the living room'
);

-- Update chore
UPDATE chores
SET
  label = 'Tidy bedroom thoroughly',
  points = 12,
  description = 'Clean room, make bed, organize toys'
WHERE id = 'chore-id-here';

-- Archive chore (soft delete)
UPDATE chores
SET is_archived = TRUE
WHERE id = 'chore-id-here';

-- Delete chore permanently
DELETE FROM chores
WHERE id = 'chore-id-here';

-- =============================================================================
-- 5. TRANSACTION MANAGEMENT
-- =============================================================================

-- Complete a chore (atomically updates points and records transaction)
SELECT complete_chore(
  'child-id-here'::UUID,
  'chore-id-here'::UUID,
  auth.uid(),
  'Great job cleaning your room!'
) AS completion_id;

-- Add money
SELECT adjust_money(
  'child-id-here'::UUID,
  5.00,
  'add',
  'Weekly allowance',
  auth.uid(),
  'GBP'
) AS transaction_id;

-- Deduct money
SELECT adjust_money(
  'child-id-here'::UUID,
  2.50,
  'deduct',
  'Bought toy from reward store',
  auth.uid(),
  'GBP'
) AS transaction_id;

-- Add screen time (minutes)
SELECT adjust_screen_time(
  'child-id-here'::UUID,
  30,
  'add',
  'Earned for completing homework',
  auth.uid()
) AS transaction_id;

-- Deduct screen time (minutes used)
SELECT adjust_screen_time(
  'child-id-here'::UUID,
  15,
  'deduct',
  'Watched YouTube',
  auth.uid()
) AS transaction_id;

-- Get child's recent transactions
SELECT
  type,
  action,
  amount,
  currency,
  reason,
  created_by_name,
  created_at
FROM recent_transactions
WHERE child_id = 'child-id-here'
ORDER BY created_at DESC
LIMIT 20;

-- Get child's transaction summary
SELECT * FROM transaction_summary WHERE child_id = 'child-id-here';

-- Get recent chore completions
SELECT
  chore_label,
  chore_icon,
  points_earned,
  completed_at,
  created_by_name,
  notes
FROM recent_chore_completions
WHERE child_id = 'child-id-here'
ORDER BY completed_at DESC
LIMIT 20;

-- Get this week's chore completions
SELECT
  c.name AS child_name,
  cc.chore_label,
  cc.points_earned,
  cc.completed_at
FROM chore_completions cc
JOIN children c ON c.id = cc.child_id
WHERE cc.week_start = DATE_TRUNC('week', NOW())::DATE
  AND c.household_id = 'household-id-here'
ORDER BY cc.completed_at DESC;

-- Delete a recent transaction (within 24 hours)
DELETE FROM transactions
WHERE id = 'transaction-id-here'
  AND created_by = auth.uid()
  AND created_at > NOW() - INTERVAL '24 hours';

-- Delete a recent chore completion (within 24 hours)
DELETE FROM chore_completions
WHERE id = 'completion-id-here'
  AND created_by = auth.uid()
  AND completed_at > NOW() - INTERVAL '24 hours';

-- =============================================================================
-- 6. ANALYTICS & REPORTS
-- =============================================================================

-- Weekly leaderboard for household
SELECT
  child_name,
  child_avatar,
  weekly_points,
  weekly_chores,
  rank
FROM weekly_leaderboard
WHERE household_id = 'household-id-here'
ORDER BY rank;

-- Monthly leaderboard for household
SELECT
  child_name,
  child_avatar,
  monthly_points,
  monthly_chores,
  rank
FROM monthly_leaderboard
WHERE household_id = 'household-id-here'
ORDER BY rank;

-- Get leaderboard using function (more flexible)
SELECT * FROM get_household_leaderboard(
  'household-id-here'::UUID,
  'week'  -- or 'month', 'all_time'
);

-- Get child's weekly stats (last 4 weeks)
SELECT
  week_start,
  chores_completed,
  points_earned,
  money_added,
  screen_time_added
FROM get_child_weekly_stats('child-id-here'::UUID, 4)
ORDER BY week_start DESC;

-- Household activity summary (this week)
SELECT
  COUNT(DISTINCT cc.child_id) AS active_children,
  COUNT(cc.id) AS total_completions,
  SUM(cc.points_earned) AS total_points,
  COUNT(DISTINCT cc.chore_id) AS unique_chores_completed
FROM chore_completions cc
JOIN children c ON c.id = cc.child_id
WHERE c.household_id = 'household-id-here'
  AND cc.week_start = DATE_TRUNC('week', NOW())::DATE;

-- Most popular chores in household
SELECT
  label,
  icon,
  category,
  completions_this_week,
  completions_this_month,
  total_completions
FROM chore_popularity
WHERE household_id = 'household-id-here'
ORDER BY completions_this_week DESC
LIMIT 5;

-- Child comparison (all children in household)
SELECT
  name,
  avatar,
  points_total AS total_points,
  chores_this_week,
  points_this_week,
  money_total,
  screen_total
FROM child_balances
WHERE household_id = 'household-id-here'
ORDER BY points_this_week DESC;

-- Transaction breakdown by type (last 30 days)
SELECT
  type,
  action,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_amount
FROM transactions
WHERE child_id = 'child-id-here'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY type, action
ORDER BY type, action;

-- =============================================================================
-- 7. MAINTENANCE & CLEANUP
-- =============================================================================

-- Cleanup old sessions (inactive for 30+ days)
SELECT cleanup_old_sessions(30);

-- Check for transactions that could be archived (6+ months old)
SELECT archive_old_transactions(6);

-- Get database statistics
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM households) AS total_households,
  (SELECT COUNT(*) FROM children WHERE is_archived = FALSE) AS active_children,
  (SELECT COUNT(*) FROM chores WHERE is_archived = FALSE) AS active_chores,
  (SELECT COUNT(*) FROM transactions) AS total_transactions,
  (SELECT COUNT(*) FROM chore_completions) AS total_completions;

-- Check RLS policies
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

-- Check indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check table sizes
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS indexes_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- =============================================================================
-- NOTES
-- =============================================================================

-- All queries above respect Row Level Security (RLS) policies.
-- Users can only access data from households they belong to.
-- Helper functions (like complete_chore, adjust_money) are atomic and handle
-- all necessary updates automatically.
--
-- Replace 'household-id-here', 'child-id-here', etc. with actual UUIDs.
-- Use auth.uid() to reference the currently authenticated user.
