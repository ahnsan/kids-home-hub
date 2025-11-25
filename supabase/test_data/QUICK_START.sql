-- =============================================
-- QUICK START - Minimal Test Data
-- =============================================
-- This script provides a minimal working setup for immediate testing
-- without dealing with auth.users complications
--
-- Use this for:
-- - Quick local testing
-- - When you'll create auth users manually later
-- - Testing database schema and triggers
--
-- This creates:
-- - User profiles with placeholders (link to auth users later)
-- - Complete household setups ready to test
--
-- After running this:
-- 1. Create actual auth users via Supabase Dashboard
-- 2. Update user_profiles to link to real auth.users IDs
-- =============================================

BEGIN;

-- =============================================
-- Cleanup (optional - uncomment to reset)
-- =============================================
/*
DELETE FROM chore_completions;
DELETE FROM transactions;
DELETE FROM chores;
DELETE FROM children;
DELETE FROM household_members;
DELETE FROM households;
DELETE FROM user_profiles;
*/

-- =============================================
-- Create placeholder user profiles
-- =============================================
-- These will be linked to actual auth.users later
INSERT INTO user_profiles (id, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Create Smith Family Household
-- =============================================
INSERT INTO households (id, name, created_by, created_at, updated_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Smith Family',
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW()
);

-- Add children
INSERT INTO children (id, household_id, name, avatar, money_total, points_total, screen_total, display_order)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Emma', '👧', 25.50, 120, 45, 1),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Noah', '👦', 18.75, 95, 30, 2);

-- Add custom chores (default chores auto-created by trigger)
INSERT INTO chores (household_id, label, points, icon, category, is_default)
SELECT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', label, points, icon, category, FALSE
FROM (VALUES
  ('Practice piano', 12, '🎹', 'education'),
  ('Water the plants', 5, '🌱', 'helping'),
  ('Take out recycling', 8, '♻️', 'cleaning'),
  ('Read for 30 minutes', 10, '📖', 'education'),
  ('Help sibling with homework', 15, '🤝', 'helping')
) AS chores(label, points, icon, category);

-- =============================================
-- Create Johnson Family Household
-- =============================================
INSERT INTO households (id, name, created_by, created_at, updated_at)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Johnson Family',
  '22222222-2222-2222-2222-222222222222',
  NOW(),
  NOW()
);

-- Add child
INSERT INTO children (id, household_id, name, avatar, money_total, points_total, screen_total, display_order)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Olivia', '🧒', 32.00, 150, 60, 1);

-- Add custom chores
INSERT INTO chores (household_id, label, points, icon, category, is_default)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', label, points, icon, category, FALSE
FROM (VALUES
  ('Walk the dog', 10, '🐕', 'pets'),
  ('Vacuum living room', 12, '🧹', 'cleaning'),
  ('Sort and organize toys', 8, '🧸', 'cleaning'),
  ('Practice math facts', 10, '🔢', 'education'),
  ('Make bed', 5, '🛏️', 'cleaning'),
  ('Empty dishwasher', 7, '🍽️', 'helping')
) AS chores(label, points, icon, category);

-- =============================================
-- Add sample recent transactions (last 3 days only)
-- =============================================

-- Emma's recent activity
INSERT INTO transactions (child_id, type, action, amount, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 10, 'Completed: Tidy bedroom', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'money', 'add', 5.00, 'Weekly allowance', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'screen_time', 'earn', 15, 'Good behavior bonus', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 12, 'Completed: Practice piano', '11111111-1111-1111-1111-111111111111', NOW());

-- Noah's recent activity
INSERT INTO transactions (child_id, type, action, amount, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 8, 'Completed: Finish homework', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'money', 'add', 5.00, 'Weekly allowance', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 7, 'Completed: Help with laundry', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),
  ('cccccccc-0000-0000-0000-000000000002', 'screen_time', 'add', 20, 'Extra screen time earned', '11111111-1111-1111-1111-111111111111', NOW());

-- Olivia's recent activity
INSERT INTO transactions (child_id, type, action, amount, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 10, 'Completed: Walk the dog', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'add', 7.00, 'Weekly allowance', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 12, 'Completed: Vacuum living room', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day'),
  ('cccccccc-0000-0000-0000-000000000003', 'screen_time', 'add', 25, 'Earned screen time', '22222222-2222-2222-2222-222222222222', NOW());

COMMIT;

-- =============================================
-- Verify Setup
-- =============================================
SELECT
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM households) as households,
  (SELECT COUNT(*) FROM children) as children,
  (SELECT COUNT(*) FROM chores) as chores,
  (SELECT COUNT(*) FROM transactions) as transactions;

-- =============================================
-- Next Steps
-- =============================================
-- 1. Create auth users via Supabase Dashboard:
--    - Email: test1@kidshub.dev
--    - Email: test2@kidshub.dev
--
-- 2. Link user_profiles to actual auth.users:
--    UPDATE user_profiles
--    SET id = '<actual-auth-user-id>'
--    WHERE id = '11111111-1111-1111-1111-111111111111';
--
-- 3. Or just start testing with placeholder IDs
--    (useful for testing schema and triggers)
-- =============================================
