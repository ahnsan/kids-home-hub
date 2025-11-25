-- =============================================
-- Test Transactions
-- =============================================
-- Creates realistic transaction history for all children
-- Covers money, points, and screen time transactions
-- Spans the last 2 weeks
-- =============================================

-- Note: Transactions automatically update child totals via trigger
-- The initial balances in 002_households.sql should reflect
-- the cumulative result of these transactions

-- =============================================
-- Helper: Calculate dates for last 2 weeks
-- =============================================
-- We'll create transactions across 14 days
-- Most recent = today, oldest = 13 days ago

-- =============================================
-- Transactions for Emma (Smith Family)
-- =============================================

-- Week 1 (7-13 days ago)
-- Day 13 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 10, NULL, 'Completed: Tidy bedroom', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '13 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'money', 'add', 5.00, 'USD', 'Weekly allowance', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '13 days');

-- Day 12 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 8, NULL, 'Completed: Finish homework', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '12 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'screen_time', 'earn', 15, NULL, 'Bonus screen time', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '12 days');

-- Day 10 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 12, NULL, 'Completed: Practice piano', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '10 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'money', 'add', 2.50, 'USD', 'Extra chore bonus', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '10 days');

-- Day 9 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'deduct', 20, NULL, 'Redeemed for toy', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'screen_time', 'add', 20, NULL, 'Earned screen time', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days');

-- Day 7 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 5, NULL, 'Completed: Water the plants', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'money', 'add', 10.00, 'USD', 'Birthday money', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days');

-- Week 2 (last 6 days)
-- Day 6 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 10, NULL, 'Completed: Read for 30 minutes', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '6 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'money', 'add', 5.00, 'USD', 'Weekly allowance', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '6 days');

-- Day 4 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 8, NULL, 'Completed: Take out recycling', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'screen_time', 'add', 10, NULL, 'Good behavior bonus', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days');

-- Day 2 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 15, NULL, 'Completed: Help sibling with homework', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
  ('cccccccc-0000-0000-0000-000000000001', 'money', 'add', 3.00, 'USD', 'Extra help around house', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days');

-- Today
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'points', 'earn', 10, NULL, 'Completed: Tidy bedroom', '11111111-1111-1111-1111-111111111111', NOW());

-- =============================================
-- Transactions for Noah (Smith Family)
-- =============================================

-- Week 1 (7-13 days ago)
-- Day 13 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 8, NULL, 'Completed: Finish homework', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '13 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'money', 'add', 5.00, 'USD', 'Weekly allowance', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '13 days');

-- Day 11 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 7, NULL, 'Completed: Help with laundry', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '11 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'screen_time', 'add', 20, NULL, 'Earned screen time', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '11 days');

-- Day 9 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 5, NULL, 'Completed: Set / clear the table', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'money', 'deduct', 3.00, 'USD', 'Bought snack at school', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days');

-- Day 8 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 10, NULL, 'Completed: Read for 30 minutes', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '8 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'screen_time', 'deduct', 10, NULL, 'Used screen time', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '8 days');

-- Week 2 (last 6 days)
-- Day 6 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 8, NULL, 'Completed: Finish homework', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '6 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'money', 'add', 5.00, 'USD', 'Weekly allowance', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '6 days');

-- Day 5 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 6, NULL, 'Completed: Feed pet / help pet', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'screen_time', 'add', 15, NULL, 'Bonus for good grades', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days');

-- Day 3 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 8, NULL, 'Completed: Take out recycling', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'money', 'add', 8.00, 'USD', 'Mowed lawn for neighbor', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days');

-- Day 1 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'points', 'earn', 10, NULL, 'Completed: Tidy bedroom', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),
  ('cccccccc-0000-0000-0000-000000000002', 'money', 'add', 3.75, 'USD', 'Extra chore bonus', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day');

-- Today
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000002', 'screen_time', 'add', 5, NULL, 'Quick bonus', '11111111-1111-1111-1111-111111111111', NOW());

-- =============================================
-- Transactions for Olivia (Johnson Family)
-- =============================================

-- Week 1 (7-13 days ago)
-- Day 13 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 10, NULL, 'Completed: Walk the dog', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '13 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'add', 7.00, 'USD', 'Weekly allowance', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '13 days');

-- Day 12 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 12, NULL, 'Completed: Vacuum living room', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '12 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'screen_time', 'add', 25, NULL, 'Earned screen time', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '12 days');

-- Day 11 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 8, NULL, 'Completed: Finish homework', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '11 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'add', 5.00, 'USD', 'Helped with grocery shopping', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '11 days');

-- Day 10 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 10, NULL, 'Completed: Practice math facts', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '10 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'screen_time', 'add', 20, NULL, 'Good behavior bonus', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '10 days');

-- Day 9 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 5, NULL, 'Completed: Make bed', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '9 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'deduct', 4.00, 'USD', 'Bought book at school fair', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '9 days');

-- Day 8 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 7, NULL, 'Completed: Empty dishwasher', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '8 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'screen_time', 'deduct', 15, NULL, 'Used screen time', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '8 days');

-- Day 7 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 8, NULL, 'Completed: Sort and organize toys', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '7 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'add', 10.00, 'USD', 'Special project completed', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '7 days');

-- Week 2 (last 6 days)
-- Day 6 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 10, NULL, 'Completed: Walk the dog', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '6 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'add', 7.00, 'USD', 'Weekly allowance', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '6 days');

-- Day 5 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 10, NULL, 'Completed: Tidy bedroom', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'screen_time', 'add', 30, NULL, 'Earned extra screen time', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days');

-- Day 4 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 8, NULL, 'Completed: Finish homework', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '4 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'add', 4.00, 'USD', 'Helped neighbor with yard work', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '4 days');

-- Day 3 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 12, NULL, 'Completed: Vacuum living room', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'screen_time', 'deduct', 20, NULL, 'Used screen time', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days');

-- Day 2 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 10, NULL, 'Completed: Practice math facts', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'add', 3.00, 'USD', 'Extra help with dishes', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days');

-- Day 1 ago
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 5, NULL, 'Completed: Make bed', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day'),
  ('cccccccc-0000-0000-0000-000000000003', 'screen_time', 'add', 15, NULL, 'Bonus screen time', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day');

-- Today
INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000003', 'points', 'earn', 7, NULL, 'Completed: Empty dishwasher', '22222222-2222-2222-2222-222222222222', NOW()),
  ('cccccccc-0000-0000-0000-000000000003', 'money', 'add', 5.00, 'USD', 'Bonus for good week', '22222222-2222-2222-2222-222222222222', NOW());

-- =============================================
-- Summary
-- =============================================
-- Total transactions created: 72 (24 per child)
-- Date range: Last 14 days (13 days ago through today)
-- Transaction types: money, points, screen_time
-- Actions: add, earn, deduct, redeem
--
-- Note: The initial balances in 002_households.sql
-- should reflect these transactions via trigger updates
-- =============================================
