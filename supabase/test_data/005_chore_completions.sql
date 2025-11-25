-- =============================================
-- Test Chore Completions
-- =============================================
-- Creates realistic chore completion history
-- Tracks weekly progress and points earned
-- Covers the last 2 weeks
-- =============================================

-- Helper function to get week start date
-- Week starts on Monday
CREATE OR REPLACE FUNCTION get_week_start(date_input TIMESTAMPTZ)
RETURNS DATE AS $$
BEGIN
  RETURN (date_input - ((EXTRACT(DOW FROM date_input)::integer + 6) % 7) * INTERVAL '1 day')::DATE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Get chore IDs for reference
-- =============================================
-- We need to reference actual chore IDs from the chores table
-- Since chores are auto-created with UUIDs, we'll use labels instead

-- =============================================
-- Chore Completions for Emma (Smith Family)
-- =============================================

-- Week 1 completions
INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '13 days',
  get_week_start(NOW() - INTERVAL '13 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Tidy bedroom';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '12 days',
  get_week_start(NOW() - INTERVAL '12 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Finish homework';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '10 days',
  get_week_start(NOW() - INTERVAL '10 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Practice piano';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '9 days',
  get_week_start(NOW() - INTERVAL '9 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Set / clear the table';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '7 days',
  get_week_start(NOW() - INTERVAL '7 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Water the plants';

-- Week 2 completions
INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '6 days',
  get_week_start(NOW() - INTERVAL '6 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Read for 30 minutes';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '4 days',
  get_week_start(NOW() - INTERVAL '4 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Take out recycling';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '2 days',
  get_week_start(NOW() - INTERVAL '2 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Help sibling with homework';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000001',
  c.id,
  c.label,
  c.points,
  NOW(),
  get_week_start(NOW()),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Tidy bedroom';

-- =============================================
-- Chore Completions for Noah (Smith Family)
-- =============================================

-- Week 1 completions
INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000002',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '13 days',
  get_week_start(NOW() - INTERVAL '13 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Finish homework';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000002',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '11 days',
  get_week_start(NOW() - INTERVAL '11 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Help with laundry';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000002',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '9 days',
  get_week_start(NOW() - INTERVAL '9 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Set / clear the table';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000002',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '8 days',
  get_week_start(NOW() - INTERVAL '8 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Read for 30 minutes';

-- Week 2 completions
INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000002',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '6 days',
  get_week_start(NOW() - INTERVAL '6 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Finish homework';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000002',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '5 days',
  get_week_start(NOW() - INTERVAL '5 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Feed pet / help pet';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000002',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '3 days',
  get_week_start(NOW() - INTERVAL '3 days'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Take out recycling';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000002',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '1 day',
  get_week_start(NOW() - INTERVAL '1 day'),
  '11111111-1111-1111-1111-111111111111'
FROM chores c
WHERE c.household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND c.label = 'Tidy bedroom';

-- =============================================
-- Chore Completions for Olivia (Johnson Family)
-- =============================================

-- Week 1 completions
INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '13 days',
  get_week_start(NOW() - INTERVAL '13 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Walk the dog';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '12 days',
  get_week_start(NOW() - INTERVAL '12 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Vacuum living room';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '11 days',
  get_week_start(NOW() - INTERVAL '11 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Finish homework';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '10 days',
  get_week_start(NOW() - INTERVAL '10 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Practice math facts';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '9 days',
  get_week_start(NOW() - INTERVAL '9 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Make bed';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '8 days',
  get_week_start(NOW() - INTERVAL '8 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Empty dishwasher';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '7 days',
  get_week_start(NOW() - INTERVAL '7 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Sort and organize toys';

-- Week 2 completions
INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '6 days',
  get_week_start(NOW() - INTERVAL '6 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Walk the dog';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '5 days',
  get_week_start(NOW() - INTERVAL '5 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Tidy bedroom';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '4 days',
  get_week_start(NOW() - INTERVAL '4 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Finish homework';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '3 days',
  get_week_start(NOW() - INTERVAL '3 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Vacuum living room';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '2 days',
  get_week_start(NOW() - INTERVAL '2 days'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Practice math facts';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW() - INTERVAL '1 day',
  get_week_start(NOW() - INTERVAL '1 day'),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Make bed';

INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
SELECT
  'cccccccc-0000-0000-0000-000000000003',
  c.id,
  c.label,
  c.points,
  NOW(),
  get_week_start(NOW()),
  '22222222-2222-2222-2222-222222222222'
FROM chores c
WHERE c.household_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND c.label = 'Empty dishwasher';

-- =============================================
-- Summary
-- =============================================
-- Emma: 9 chore completions over 2 weeks
-- Noah: 8 chore completions over 2 weeks
-- Olivia: 14 chore completions over 2 weeks
--
-- Note: Chore completions automatically update
-- child points_total via trigger
-- =============================================
