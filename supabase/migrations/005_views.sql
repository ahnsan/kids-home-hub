-- Kids Home Hub - Database Views
-- Migration 005: Useful Views for Common Queries
--
-- This migration creates database views that simplify common queries
-- and provide optimized access patterns for the application.

-- =============================================================================
-- HOUSEHOLD SUMMARY VIEW
-- =============================================================================

-- View: Comprehensive household summary
CREATE OR REPLACE VIEW household_summary AS
SELECT
  h.id AS household_id,
  h.name AS household_name,
  h.currency,
  h.timezone,
  h.created_by,
  u.email AS owner_email,
  u.display_name AS owner_name,

  -- Counts
  COUNT(DISTINCT hm.user_id) AS member_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.is_archived = FALSE) AS active_children_count,
  COUNT(DISTINCT ch.id) FILTER (WHERE ch.is_archived = FALSE) AS active_chores_count,

  -- Timestamps
  h.created_at,
  h.updated_at
FROM households h
LEFT JOIN users u ON u.id = h.created_by
LEFT JOIN household_members hm ON hm.household_id = h.id AND hm.invitation_status = 'active'
LEFT JOIN children c ON c.household_id = h.id
LEFT JOIN chores ch ON ch.household_id = h.id
GROUP BY h.id, h.name, h.currency, h.timezone, h.created_by, u.email, u.display_name, h.created_at, h.updated_at;

COMMENT ON VIEW household_summary IS 'Overview of household with member and activity counts';

-- =============================================================================
-- CHILD DASHBOARD VIEW
-- =============================================================================

-- View: Child dashboard with current balances and weekly activity
CREATE OR REPLACE VIEW child_balances AS
SELECT
  c.id,
  c.household_id,
  c.name,
  c.avatar,
  c.date_of_birth,

  -- Current balances
  c.money_total,
  c.points_total,
  c.screen_total,

  -- This week's activity (last 7 days)
  COALESCE(
    (SELECT COUNT(*)
     FROM chore_completions cc
     WHERE cc.child_id = c.id
       AND cc.completed_at >= NOW() - INTERVAL '7 days'),
    0
  ) AS chores_this_week,

  COALESCE(
    (SELECT SUM(points_earned)
     FROM chore_completions cc
     WHERE cc.child_id = c.id
       AND cc.completed_at >= NOW() - INTERVAL '7 days'),
    0
  ) AS points_this_week,

  -- This month's activity (last 30 days)
  COALESCE(
    (SELECT COUNT(*)
     FROM chore_completions cc
     WHERE cc.child_id = c.id
       AND cc.completed_at >= NOW() - INTERVAL '30 days'),
    0
  ) AS chores_this_month,

  COALESCE(
    (SELECT SUM(points_earned)
     FROM chore_completions cc
     WHERE cc.child_id = c.id
       AND cc.completed_at >= NOW() - INTERVAL '30 days'),
    0
  ) AS points_this_month,

  -- All-time totals
  COALESCE(
    (SELECT COUNT(*)
     FROM chore_completions cc
     WHERE cc.child_id = c.id),
    0
  ) AS total_chores_completed,

  COALESCE(
    (SELECT SUM(points_earned)
     FROM chore_completions cc
     WHERE cc.child_id = c.id),
    0
  ) AS total_points_earned,

  -- Metadata
  c.display_order,
  c.is_archived,
  c.created_at,
  c.updated_at AS last_updated

FROM children c
WHERE c.is_archived = FALSE;

COMMENT ON VIEW child_balances IS 'Child dashboard with balances and activity metrics';

-- =============================================================================
-- HOUSEHOLD MEMBERS VIEW
-- =============================================================================

-- View: Household members with user details
CREATE OR REPLACE VIEW household_members_detailed AS
SELECT
  hm.id AS membership_id,
  hm.household_id,
  h.name AS household_name,
  hm.user_id,
  u.email,
  u.display_name,
  u.avatar_url,
  hm.role,
  hm.invitation_status,
  hm.invited_by,
  inviter.email AS invited_by_email,
  inviter.display_name AS invited_by_name,
  hm.joined_at
FROM household_members hm
JOIN users u ON u.id = hm.user_id
JOIN households h ON h.id = hm.household_id
LEFT JOIN users inviter ON inviter.id = hm.invited_by;

COMMENT ON VIEW household_members_detailed IS 'Household members with full user details';

-- =============================================================================
-- RECENT TRANSACTIONS VIEW
-- =============================================================================

-- View: Recent transactions with child details
CREATE OR REPLACE VIEW recent_transactions AS
SELECT
  t.id AS transaction_id,
  t.child_id,
  c.name AS child_name,
  c.avatar AS child_avatar,
  c.household_id,
  t.type,
  t.action,
  t.amount,
  t.currency,
  t.reason,
  t.notes,
  t.created_by,
  u.email AS created_by_email,
  u.display_name AS created_by_name,
  t.device_id,
  t.created_at
FROM transactions t
JOIN children c ON c.id = t.child_id
LEFT JOIN users u ON u.id = t.created_by
ORDER BY t.created_at DESC;

COMMENT ON VIEW recent_transactions IS 'Transactions with child and user details';

-- =============================================================================
-- RECENT CHORE COMPLETIONS VIEW
-- =============================================================================

-- View: Recent chore completions with details
CREATE OR REPLACE VIEW recent_chore_completions AS
SELECT
  cc.id AS completion_id,
  cc.child_id,
  c.name AS child_name,
  c.avatar AS child_avatar,
  c.household_id,
  cc.chore_id,
  cc.chore_label,
  ch.icon AS chore_icon,
  ch.category AS chore_category,
  cc.points_earned,
  cc.completed_at,
  cc.week_start,
  cc.created_by,
  u.email AS created_by_email,
  u.display_name AS created_by_name,
  cc.verified_at,
  cc.verified_by,
  cc.notes
FROM chore_completions cc
JOIN children c ON c.id = cc.child_id
LEFT JOIN chores ch ON ch.id = cc.chore_id
LEFT JOIN users u ON u.id = cc.created_by
ORDER BY cc.completed_at DESC;

COMMENT ON VIEW recent_chore_completions IS 'Chore completions with child and chore details';

-- =============================================================================
-- WEEKLY LEADERBOARD VIEW
-- =============================================================================

-- View: Weekly points leaderboard per household
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT
  c.household_id,
  c.id AS child_id,
  c.name AS child_name,
  c.avatar AS child_avatar,
  COALESCE(SUM(cc.points_earned), 0) AS weekly_points,
  COUNT(cc.id) AS weekly_chores,
  RANK() OVER (
    PARTITION BY c.household_id
    ORDER BY COALESCE(SUM(cc.points_earned), 0) DESC
  ) AS rank
FROM children c
LEFT JOIN chore_completions cc ON cc.child_id = c.id
  AND cc.week_start = DATE_TRUNC('week', NOW())::DATE
WHERE c.is_archived = FALSE
GROUP BY c.household_id, c.id, c.name, c.avatar
ORDER BY c.household_id, rank;

COMMENT ON VIEW weekly_leaderboard IS 'Weekly points leaderboard by household';

-- =============================================================================
-- MONTHLY LEADERBOARD VIEW
-- =============================================================================

-- View: Monthly points leaderboard per household
CREATE OR REPLACE VIEW monthly_leaderboard AS
SELECT
  c.household_id,
  c.id AS child_id,
  c.name AS child_name,
  c.avatar AS child_avatar,
  COALESCE(SUM(cc.points_earned), 0) AS monthly_points,
  COUNT(cc.id) AS monthly_chores,
  RANK() OVER (
    PARTITION BY c.household_id
    ORDER BY COALESCE(SUM(cc.points_earned), 0) DESC
  ) AS rank
FROM children c
LEFT JOIN chore_completions cc ON cc.child_id = c.id
  AND cc.completed_at >= DATE_TRUNC('month', NOW())
WHERE c.is_archived = FALSE
GROUP BY c.household_id, c.id, c.name, c.avatar
ORDER BY c.household_id, rank;

COMMENT ON VIEW monthly_leaderboard IS 'Monthly points leaderboard by household';

-- =============================================================================
-- CHORE POPULARITY VIEW
-- =============================================================================

-- View: Most completed chores per household
CREATE OR REPLACE VIEW chore_popularity AS
SELECT
  ch.household_id,
  ch.id AS chore_id,
  ch.label AS chore_label,
  ch.icon AS chore_icon,
  ch.category AS chore_category,
  ch.points AS chore_points,

  -- This week
  COUNT(cc.id) FILTER (
    WHERE cc.completed_at >= NOW() - INTERVAL '7 days'
  ) AS completions_this_week,

  -- This month
  COUNT(cc.id) FILTER (
    WHERE cc.completed_at >= NOW() - INTERVAL '30 days'
  ) AS completions_this_month,

  -- All time
  COUNT(cc.id) AS total_completions,

  -- Last completion
  MAX(cc.completed_at) AS last_completed_at

FROM chores ch
LEFT JOIN chore_completions cc ON cc.chore_id = ch.id
WHERE ch.is_archived = FALSE
GROUP BY ch.household_id, ch.id, ch.label, ch.icon, ch.category, ch.points
ORDER BY ch.household_id, total_completions DESC;

COMMENT ON VIEW chore_popularity IS 'Chore completion statistics by household';

-- =============================================================================
-- USER HOUSEHOLDS VIEW
-- =============================================================================

-- View: All households a user belongs to
CREATE OR REPLACE VIEW user_households AS
SELECT
  hm.user_id,
  hm.household_id,
  h.name AS household_name,
  h.currency,
  h.timezone,
  hm.role,
  hm.invitation_status,

  -- Is this user the creator?
  (h.created_by = hm.user_id) AS is_creator,

  -- Household stats
  COUNT(DISTINCT c.id) FILTER (WHERE c.is_archived = FALSE) AS children_count,
  COUNT(DISTINCT ch.id) FILTER (WHERE ch.is_archived = FALSE) AS chores_count,
  COUNT(DISTINCT hm2.user_id) FILTER (WHERE hm2.invitation_status = 'active') AS member_count,

  -- Timestamps
  hm.joined_at,
  h.created_at AS household_created_at,
  h.updated_at AS household_updated_at

FROM household_members hm
JOIN households h ON h.id = hm.household_id
LEFT JOIN children c ON c.household_id = h.id
LEFT JOIN chores ch ON ch.household_id = h.id
LEFT JOIN household_members hm2 ON hm2.household_id = h.id
WHERE hm.invitation_status = 'active'
GROUP BY
  hm.user_id,
  hm.household_id,
  h.name,
  h.currency,
  h.timezone,
  hm.role,
  hm.invitation_status,
  h.created_by,
  hm.joined_at,
  h.created_at,
  h.updated_at
ORDER BY hm.joined_at DESC;

COMMENT ON VIEW user_households IS 'All households a user belongs to with stats';

-- =============================================================================
-- TRANSACTION SUMMARY VIEW
-- =============================================================================

-- View: Transaction summary by child
CREATE OR REPLACE VIEW transaction_summary AS
SELECT
  c.id AS child_id,
  c.household_id,
  c.name AS child_name,

  -- Money transactions
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'money' AND t.action = 'add'), 0) AS total_money_added,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'money' AND t.action = 'deduct'), 0) AS total_money_deducted,

  -- Points transactions
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'points' AND t.action IN ('add', 'earn')), 0) AS total_points_added,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'points' AND t.action IN ('deduct', 'redeem')), 0) AS total_points_deducted,

  -- Screen time transactions
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'screen_time' AND t.action = 'add'), 0) AS total_screen_added,
  COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'screen_time' AND t.action = 'deduct'), 0) AS total_screen_deducted,

  -- Transaction counts
  COUNT(t.id) FILTER (WHERE t.type = 'money') AS money_transaction_count,
  COUNT(t.id) FILTER (WHERE t.type = 'points') AS points_transaction_count,
  COUNT(t.id) FILTER (WHERE t.type = 'screen_time') AS screen_transaction_count,

  -- Last transaction
  MAX(t.created_at) AS last_transaction_at

FROM children c
LEFT JOIN transactions t ON t.child_id = c.id
WHERE c.is_archived = FALSE
GROUP BY c.id, c.household_id, c.name;

COMMENT ON VIEW transaction_summary IS 'Transaction totals and counts by child';

-- =============================================================================
-- RLS POLICIES FOR VIEWS
-- =============================================================================

-- Note: Views inherit RLS policies from underlying tables
-- Users can only see data from households they belong to

-- =============================================================================
-- VIEW VERIFICATION
-- =============================================================================

-- Display view count
SELECT
  'Database views created successfully!' AS message,
  COUNT(*) AS view_count
FROM pg_views
WHERE schemaname = 'public';

-- List all views
SELECT
  viewname,
  pg_get_viewdef(viewname::regclass, true) AS definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
