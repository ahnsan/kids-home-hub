-- =============================================
-- Test Households and Children
-- =============================================
-- Creates households and children for test users
-- Sets up initial balances for each child
-- =============================================

-- =============================================
-- Household 1: Smith Family
-- =============================================
INSERT INTO households (id, name, created_by, created_at, updated_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Smith Family',
  '11111111-1111-1111-1111-111111111111', -- test1@kidshub.dev
  NOW(),
  NOW()
);

-- Note: household_members and default chores are automatically created by trigger

-- Children for Smith Family
INSERT INTO children (id, household_id, name, avatar, money_total, points_total, screen_total, display_order, created_at, updated_at)
VALUES
  (
    'cccccccc-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Emma',
    '👧',
    25.50,  -- Initial money balance
    120,    -- Initial points
    45,     -- Initial screen time (minutes)
    1,
    NOW(),
    NOW()
  ),
  (
    'cccccccc-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Noah',
    '👦',
    18.75,  -- Initial money balance
    95,     -- Initial points
    30,     -- Initial screen time (minutes)
    2,
    NOW(),
    NOW()
  );

-- =============================================
-- Household 2: Johnson Family
-- =============================================
INSERT INTO households (id, name, created_by, created_at, updated_at)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Johnson Family',
  '22222222-2222-2222-2222-222222222222', -- test2@kidshub.dev
  NOW(),
  NOW()
);

-- Note: household_members and default chores are automatically created by trigger

-- Children for Johnson Family
INSERT INTO children (id, household_id, name, avatar, money_total, points_total, screen_total, display_order, created_at, updated_at)
VALUES
  (
    'cccccccc-0000-0000-0000-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Olivia',
    '🧒',
    32.00,  -- Initial money balance
    150,    -- Initial points
    60,     -- Initial screen time (minutes)
    1,
    NOW(),
    NOW()
  );

-- =============================================
-- Verify Children Ages (via metadata)
-- =============================================
-- Note: The schema doesn't include an 'age' field
-- If age tracking is needed, you can:
-- 1. Add a 'date_of_birth' column to children table
-- 2. Store age in a JSON metadata field
-- 3. Calculate age from birthdate when needed
--
-- For now, ages are documented here:
-- Emma: 8 years old
-- Noah: 12 years old
-- Olivia: 10 years old
-- =============================================

-- =============================================
-- Summary
-- =============================================
-- Household 1 (Smith Family):
--   - Owner: test1@kidshub.dev
--   - Children: Emma (age 8), Noah (age 12)
--   - Emma: $25.50, 120 points, 45 min screen time
--   - Noah: $18.75, 95 points, 30 min screen time
--
-- Household 2 (Johnson Family):
--   - Owner: test2@kidshub.dev
--   - Children: Olivia (age 10)
--   - Olivia: $32.00, 150 points, 60 min screen time
-- =============================================
