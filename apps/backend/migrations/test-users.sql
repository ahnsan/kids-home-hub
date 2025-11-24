-- ============================================================================
-- Kids Home Hub - Test Users Migration
-- ============================================================================
-- This script creates two test user accounts with sample data for testing
-- the Kids Home Hub application. Each user has a household with children
-- and realistic transaction histories.
--
-- Test Users:
-- 1. test1@kidshub.dev - Smith Family (2 children with diverse activity)
-- 2. test2@kidshub.dev - Johnson Family (1 child for simpler testing)
--
-- Usage:
--   psql $DATABASE_URL -f test-users.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: USER 1 - SMITH FAMILY (Complex Testing Scenario)
-- ============================================================================

-- Create User 1
DO $$
DECLARE
  v_user1_id UUID;
  v_household1_id UUID;
  v_emma_id UUID;
  v_noah_id UUID;
  v_chore1_id UUID;
  v_chore2_id UUID;
  v_chore3_id UUID;
  v_chore4_id UUID;
  v_chore5_id UUID;
  v_week_start DATE;
BEGIN
  -- Get or create user
  v_user1_id := get_or_create_user('test1@kidshub.dev');

  -- Mark email as verified
  UPDATE users
  SET email_verified = TRUE, updated_at = NOW()
  WHERE id = v_user1_id;

  RAISE NOTICE 'User 1 created: test1@kidshub.dev (ID: %)', v_user1_id;

  -- Create Smith Family household
  INSERT INTO households (name, owner_id, created_by)
  VALUES ('Smith Family', v_user1_id, v_user1_id)
  RETURNING id INTO v_household1_id;

  RAISE NOTICE 'Household created: Smith Family (ID: %)', v_household1_id;

  -- Add user to household_members
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (v_household1_id, v_user1_id, 'owner');

  -- Create default chores for household
  SELECT create_default_chores(v_household1_id);

  -- Get chore IDs for later use
  SELECT id INTO v_chore1_id FROM chores WHERE household_id = v_household1_id AND label = 'Tidy bedroom' LIMIT 1;
  SELECT id INTO v_chore2_id FROM chores WHERE household_id = v_household1_id AND label = 'Finish homework' LIMIT 1;
  SELECT id INTO v_chore3_id FROM chores WHERE household_id = v_household1_id AND label = 'Set / clear the table' LIMIT 1;
  SELECT id INTO v_chore4_id FROM chores WHERE household_id = v_household1_id AND label = 'Feed pet / help pet' LIMIT 1;
  SELECT id INTO v_chore5_id FROM chores WHERE household_id = v_household1_id AND label = 'Help with laundry' LIMIT 1;

  -- Add custom chore for variety
  INSERT INTO chores (household_id, label, icon, points, category, is_default, created_by)
  VALUES (v_household1_id, 'Water the plants', '🌱', 4, 'helping', FALSE, v_user1_id);

  -- ========================================================================
  -- Child 1: Emma (Age 8)
  -- Current state: 150 points, 60 min screen time, £12.50
  -- ========================================================================

  INSERT INTO children (household_id, name, avatar, age, money_total, points_total, screen_total)
  VALUES (v_household1_id, 'Emma', '👧', 8, 12.50, 150, 60)
  RETURNING id INTO v_emma_id;

  RAISE NOTICE 'Child created: Emma (ID: %)', v_emma_id;

  -- Emma's transaction history (working backwards from current state)
  v_week_start := DATE_TRUNC('week', NOW())::DATE;

  -- Week 1 (current week) - Emma's activity
  -- Monday: Tidied bedroom
  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES (v_emma_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '2 days' - INTERVAL '8 hours', v_user1_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES (v_emma_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '2 days' - INTERVAL '8 hours', v_user1_id);

  -- Monday: Finished homework
  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES (v_emma_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '2 days' - INTERVAL '6 hours', v_user1_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES (v_emma_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '2 days' - INTERVAL '6 hours', v_user1_id);

  -- Tuesday: Set the table
  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES (v_emma_id, v_chore3_id, 'Set / clear the table', 5, v_week_start, NOW() - INTERVAL '1 day' - INTERVAL '7 hours', v_user1_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES (v_emma_id, 'points', 'earn', 5, 'Completed: Set / clear the table', NOW() - INTERVAL '1 day' - INTERVAL '7 hours', v_user1_id);

  -- Tuesday: Fed pet
  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES (v_emma_id, v_chore4_id, 'Feed pet / help pet', 6, v_week_start, NOW() - INTERVAL '1 day' - INTERVAL '4 hours', v_user1_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES (v_emma_id, 'points', 'earn', 6, 'Completed: Feed pet / help pet', NOW() - INTERVAL '1 day' - INTERVAL '4 hours', v_user1_id);

  -- Wednesday: Earned screen time (parent reward)
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES (v_emma_id, 'screen', 'earn', 30, 'Good behavior today!', NOW() - INTERVAL '4 hours', v_user1_id);

  -- Last week - Emma's activity
  v_week_start := (DATE_TRUNC('week', NOW()) - INTERVAL '1 week')::DATE;

  -- Previous week chores
  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES
    (v_emma_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '7 days', v_user1_id),
    (v_emma_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '8 days', v_user1_id),
    (v_emma_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '7 days', v_user1_id),
    (v_emma_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '9 days', v_user1_id),
    (v_emma_id, v_chore3_id, 'Set / clear the table', 5, v_week_start, NOW() - INTERVAL '8 days', v_user1_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_emma_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '7 days', v_user1_id),
    (v_emma_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '8 days', v_user1_id),
    (v_emma_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '7 days', v_user1_id),
    (v_emma_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '9 days', v_user1_id),
    (v_emma_id, 'points', 'earn', 5, 'Completed: Set / clear the table', NOW() - INTERVAL '8 days', v_user1_id);

  -- Money transactions for Emma
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_emma_id, 'money', 'earn', 5.00, 'Weekly allowance', NOW() - INTERVAL '7 days', v_user1_id),
    (v_emma_id, 'money', 'earn', 5.00, 'Weekly allowance', NOW() - INTERVAL '14 days', v_user1_id),
    (v_emma_id, 'money', 'earn', 3.50, 'Extra chores bonus', NOW() - INTERVAL '10 days', v_user1_id),
    (v_emma_id, 'money', 'spend', -1.00, 'Bought candy', NOW() - INTERVAL '5 days', v_user1_id);

  -- Screen time transactions for Emma
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_emma_id, 'screen', 'earn', 60, 'Weekend reward', NOW() - INTERVAL '6 days', v_user1_id),
    (v_emma_id, 'screen', 'spend', -30, 'Watched tablet', NOW() - INTERVAL '3 days', v_user1_id);

  -- Points redemption
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES (v_emma_id, 'points', 'spend', -20, 'Redeemed for toy', NOW() - INTERVAL '12 days', v_user1_id);

  -- ========================================================================
  -- Child 2: Noah (Age 12)
  -- Current state: 85 points, 30 min screen time, £25.00
  -- ========================================================================

  INSERT INTO children (household_id, name, avatar, age, money_total, points_total, screen_total)
  VALUES (v_household1_id, 'Noah', '👦', 12, 25.00, 85, 30)
  RETURNING id INTO v_noah_id;

  RAISE NOTICE 'Child created: Noah (ID: %)', v_noah_id;

  -- Noah's transaction history
  v_week_start := DATE_TRUNC('week', NOW())::DATE;

  -- Current week - Noah's activity (fewer chores, older child)
  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES
    (v_noah_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '2 days', v_user1_id),
    (v_noah_id, v_chore5_id, 'Help with laundry', 7, v_week_start, NOW() - INTERVAL '1 day', v_user1_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_noah_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '2 days', v_user1_id),
    (v_noah_id, 'points', 'earn', 7, 'Completed: Help with laundry', NOW() - INTERVAL '1 day', v_user1_id);

  -- Last week - Noah's activity
  v_week_start := (DATE_TRUNC('week', NOW()) - INTERVAL '1 week')::DATE;

  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES
    (v_noah_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '7 days', v_user1_id),
    (v_noah_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '9 days', v_user1_id),
    (v_noah_id, v_chore5_id, 'Help with laundry', 7, v_week_start, NOW() - INTERVAL '8 days', v_user1_id),
    (v_noah_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '10 days', v_user1_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_noah_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '7 days', v_user1_id),
    (v_noah_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '9 days', v_user1_id),
    (v_noah_id, 'points', 'earn', 7, 'Completed: Help with laundry', NOW() - INTERVAL '8 days', v_user1_id),
    (v_noah_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '10 days', v_user1_id);

  -- Money transactions for Noah (higher allowance, older child)
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_noah_id, 'money', 'earn', 10.00, 'Weekly allowance', NOW() - INTERVAL '7 days', v_user1_id),
    (v_noah_id, 'money', 'earn', 10.00, 'Weekly allowance', NOW() - INTERVAL '14 days', v_user1_id),
    (v_noah_id, 'money', 'earn', 5.00, 'Mowed the lawn', NOW() - INTERVAL '10 days', v_user1_id),
    (v_noah_id, 'money', 'earn', 8.00, 'Birthday money', NOW() - INTERVAL '20 days', v_user1_id),
    (v_noah_id, 'money', 'spend', -8.00, 'Bought game', NOW() - INTERVAL '5 days', v_user1_id);

  -- Screen time transactions for Noah
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_noah_id, 'screen', 'earn', 90, 'Weekend reward', NOW() - INTERVAL '6 days', v_user1_id),
    (v_noah_id, 'screen', 'spend', -60, 'Gaming session', NOW() - INTERVAL '3 days', v_user1_id);

  -- Points transactions (saving up for something)
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_noah_id, 'points', 'earn', 15, 'Helped neighbor', NOW() - INTERVAL '15 days', v_user1_id),
    (v_noah_id, 'points', 'spend', -10, 'Deduction for fighting', NOW() - INTERVAL '11 days', v_user1_id);

END $$;

-- ============================================================================
-- SECTION 2: USER 2 - JOHNSON FAMILY (Simple Testing Scenario)
-- ============================================================================

DO $$
DECLARE
  v_user2_id UUID;
  v_household2_id UUID;
  v_olivia_id UUID;
  v_chore1_id UUID;
  v_chore2_id UUID;
  v_chore3_id UUID;
  v_chore4_id UUID;
  v_week_start DATE;
BEGIN
  -- Get or create user
  v_user2_id := get_or_create_user('test2@kidshub.dev');

  -- Mark email as verified
  UPDATE users
  SET email_verified = TRUE, updated_at = NOW()
  WHERE id = v_user2_id;

  RAISE NOTICE 'User 2 created: test2@kidshub.dev (ID: %)', v_user2_id;

  -- Create Johnson Family household
  INSERT INTO households (name, owner_id, created_by)
  VALUES ('Johnson Family', v_user2_id, v_user2_id)
  RETURNING id INTO v_household2_id;

  RAISE NOTICE 'Household created: Johnson Family (ID: %)', v_household2_id;

  -- Add user to household_members
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (v_household2_id, v_user2_id, 'owner');

  -- Create default chores for household
  SELECT create_default_chores(v_household2_id);

  -- Get chore IDs for later use
  SELECT id INTO v_chore1_id FROM chores WHERE household_id = v_household2_id AND label = 'Tidy bedroom' LIMIT 1;
  SELECT id INTO v_chore2_id FROM chores WHERE household_id = v_household2_id AND label = 'Finish homework' LIMIT 1;
  SELECT id INTO v_chore3_id FROM chores WHERE household_id = v_household2_id AND label = 'Set / clear the table' LIMIT 1;
  SELECT id INTO v_chore4_id FROM chores WHERE household_id = v_household2_id AND label = 'Feed pet / help pet' LIMIT 1;

  -- ========================================================================
  -- Child 1: Olivia (Age 10)
  -- Current state: 200 points, 90 min screen time, £8.75
  -- ========================================================================

  INSERT INTO children (household_id, name, avatar, age, money_total, points_total, screen_total)
  VALUES (v_household2_id, 'Olivia', '👧', 10, 8.75, 200, 90)
  RETURNING id INTO v_olivia_id;

  RAISE NOTICE 'Child created: Olivia (ID: %)', v_olivia_id;

  -- Olivia's transaction history (she's very diligent!)
  v_week_start := DATE_TRUNC('week', NOW())::DATE;

  -- Current week - Olivia's activity (very active child)
  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES
    (v_olivia_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '2 days', v_user2_id),
    (v_olivia_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '2 days', v_user2_id),
    (v_olivia_id, v_chore3_id, 'Set / clear the table', 5, v_week_start, NOW() - INTERVAL '2 days', v_user2_id),
    (v_olivia_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '1 day', v_user2_id),
    (v_olivia_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '1 day', v_user2_id),
    (v_olivia_id, v_chore3_id, 'Set / clear the table', 5, v_week_start, NOW() - INTERVAL '1 day', v_user2_id),
    (v_olivia_id, v_chore4_id, 'Feed pet / help pet', 6, v_week_start, NOW() - INTERVAL '6 hours', v_user2_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_olivia_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '2 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '2 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 5, 'Completed: Set / clear the table', NOW() - INTERVAL '2 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '1 day', v_user2_id),
    (v_olivia_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '1 day', v_user2_id),
    (v_olivia_id, 'points', 'earn', 5, 'Completed: Set / clear the table', NOW() - INTERVAL '1 day', v_user2_id),
    (v_olivia_id, 'points', 'earn', 6, 'Completed: Feed pet / help pet', NOW() - INTERVAL '6 hours', v_user2_id);

  -- Last week - Olivia's activity
  v_week_start := (DATE_TRUNC('week', NOW()) - INTERVAL '1 week')::DATE;

  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, completed_at, created_by)
  VALUES
    (v_olivia_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '7 days', v_user2_id),
    (v_olivia_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '8 days', v_user2_id),
    (v_olivia_id, v_chore1_id, 'Tidy bedroom', 10, v_week_start, NOW() - INTERVAL '9 days', v_user2_id),
    (v_olivia_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '7 days', v_user2_id),
    (v_olivia_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '8 days', v_user2_id),
    (v_olivia_id, v_chore2_id, 'Finish homework', 8, v_week_start, NOW() - INTERVAL '9 days', v_user2_id),
    (v_olivia_id, v_chore3_id, 'Set / clear the table', 5, v_week_start, NOW() - INTERVAL '10 days', v_user2_id),
    (v_olivia_id, v_chore3_id, 'Set / clear the table', 5, v_week_start, NOW() - INTERVAL '8 days', v_user2_id),
    (v_olivia_id, v_chore4_id, 'Feed pet / help pet', 6, v_week_start, NOW() - INTERVAL '7 days', v_user2_id),
    (v_olivia_id, v_chore4_id, 'Feed pet / help pet', 6, v_week_start, NOW() - INTERVAL '9 days', v_user2_id);

  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_olivia_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '7 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '8 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 10, 'Completed: Tidy bedroom', NOW() - INTERVAL '9 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '7 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '8 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 8, 'Completed: Finish homework', NOW() - INTERVAL '9 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 5, 'Completed: Set / clear the table', NOW() - INTERVAL '10 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 5, 'Completed: Set / clear the table', NOW() - INTERVAL '8 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 6, 'Completed: Feed pet / help pet', NOW() - INTERVAL '7 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 6, 'Completed: Feed pet / help pet', NOW() - INTERVAL '9 days', v_user2_id);

  -- Money transactions for Olivia
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_olivia_id, 'money', 'earn', 7.50, 'Weekly allowance', NOW() - INTERVAL '7 days', v_user2_id),
    (v_olivia_id, 'money', 'earn', 7.50, 'Weekly allowance', NOW() - INTERVAL '14 days', v_user2_id),
    (v_olivia_id, 'money', 'spend', -6.25, 'Bought book', NOW() - INTERVAL '4 days', v_user2_id);

  -- Screen time transactions for Olivia
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_olivia_id, 'screen', 'earn', 120, 'Weekend reward for great week', NOW() - INTERVAL '6 days', v_user2_id),
    (v_olivia_id, 'screen', 'spend', -30, 'Watched movie', NOW() - INTERVAL '5 days', v_user2_id);

  -- Points bonus for being so diligent
  INSERT INTO transactions (child_id, type, action, amount, reason, created_at, created_by)
  VALUES
    (v_olivia_id, 'points', 'earn', 25, 'Perfect week bonus!', NOW() - INTERVAL '7 days', v_user2_id),
    (v_olivia_id, 'points', 'earn', 20, 'Helped sibling', NOW() - INTERVAL '12 days', v_user2_id);

END $$;

-- ============================================================================
-- SECTION 3: SUMMARY & VERIFICATION
-- ============================================================================

-- Display summary of created test data
DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_household1_id UUID;
  v_household2_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO v_user1_id FROM users WHERE email = 'test1@kidshub.dev';
  SELECT id INTO v_user2_id FROM users WHERE email = 'test2@kidshub.dev';

  -- Get household IDs
  SELECT id INTO v_household1_id FROM households WHERE owner_id = v_user1_id;
  SELECT id INTO v_household2_id FROM households WHERE owner_id = v_user2_id;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'TEST USERS CREATED SUCCESSFULLY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'USER 1 - Smith Family (Complex Testing)';
  RAISE NOTICE '  Email: test1@kidshub.dev';
  RAISE NOTICE '  User ID: %', v_user1_id;
  RAISE NOTICE '  Household ID: %', v_household1_id;
  RAISE NOTICE '  Children: 2 (Emma, Noah)';
  RAISE NOTICE '';
  RAISE NOTICE 'USER 2 - Johnson Family (Simple Testing)';
  RAISE NOTICE '  Email: test2@kidshub.dev';
  RAISE NOTICE '  User ID: %', v_user2_id;
  RAISE NOTICE '  Household ID: %', v_household2_id;
  RAISE NOTICE '  Children: 1 (Olivia)';
  RAISE NOTICE '';
  RAISE NOTICE 'Use these credentials to test authentication and features.';
  RAISE NOTICE '============================================================================';
END $$;

-- Verification queries (commented out - uncomment to verify data)
-- SELECT 'Users Created:' as info;
-- SELECT email, email_verified, created_at FROM users WHERE email LIKE '%@kidshub.dev' ORDER BY email;

-- SELECT 'Households Created:' as info;
-- SELECT h.name, u.email as owner, h.created_at
-- FROM households h
-- JOIN users u ON h.owner_id = u.id
-- WHERE u.email LIKE '%@kidshub.dev'
-- ORDER BY h.name;

-- SELECT 'Children with Balances:' as info;
-- SELECT c.name, c.age, h.name as household,
--        c.money_total, c.points_total, c.screen_total
-- FROM children c
-- JOIN households h ON c.household_id = h.id
-- JOIN users u ON h.owner_id = u.id
-- WHERE u.email LIKE '%@kidshub.dev'
-- ORDER BY h.name, c.name;

-- SELECT 'Transaction Counts:' as info;
-- SELECT c.name as child, h.name as household,
--        COUNT(*) as total_transactions,
--        SUM(CASE WHEN t.type = 'points' THEN 1 ELSE 0 END) as points_trans,
--        SUM(CASE WHEN t.type = 'money' THEN 1 ELSE 0 END) as money_trans,
--        SUM(CASE WHEN t.type = 'screen' THEN 1 ELSE 0 END) as screen_trans
-- FROM transactions t
-- JOIN children c ON t.child_id = c.id
-- JOIN households h ON c.household_id = h.id
-- JOIN users u ON h.owner_id = u.id
-- WHERE u.email LIKE '%@kidshub.dev'
-- GROUP BY c.name, h.name
-- ORDER BY h.name, c.name;

-- SELECT 'Chore Completions:' as info;
-- SELECT c.name as child, h.name as household,
--        COUNT(*) as total_chores_completed,
--        SUM(cc.points_earned) as total_points_from_chores
-- FROM chore_completions cc
-- JOIN children c ON cc.child_id = c.id
-- JOIN households h ON c.household_id = h.id
-- JOIN users u ON h.owner_id = u.id
-- WHERE u.email LIKE '%@kidshub.dev'
-- GROUP BY c.name, h.name
-- ORDER BY h.name, c.name;

COMMIT;
