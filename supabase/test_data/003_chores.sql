-- =============================================
-- Test Chores
-- =============================================
-- Creates default and custom chores for test households
-- Default chores are automatically created by trigger,
-- this adds custom chores specific to each family
-- =============================================

-- =============================================
-- Custom Chores for Smith Family
-- =============================================
INSERT INTO chores (household_id, label, points, icon, category, is_default, created_at, updated_at)
VALUES
  -- Custom chores specific to Smith household
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Practice piano',
    12,
    '🎹',
    'education',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Water the plants',
    5,
    '🌱',
    'helping',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Take out recycling',
    8,
    '♻️',
    'cleaning',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Read for 30 minutes',
    10,
    '📖',
    'education',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Help sibling with homework',
    15,
    '🤝',
    'helping',
    FALSE,
    NOW(),
    NOW()
  );

-- =============================================
-- Custom Chores for Johnson Family
-- =============================================
INSERT INTO chores (household_id, label, points, icon, category, is_default, created_at, updated_at)
VALUES
  -- Custom chores specific to Johnson household
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Walk the dog',
    10,
    '🐕',
    'pets',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Vacuum living room',
    12,
    '🧹',
    'cleaning',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Sort and organize toys',
    8,
    '🧸',
    'cleaning',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Practice math facts',
    10,
    '🔢',
    'education',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Make bed',
    5,
    '🛏️',
    'cleaning',
    FALSE,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Empty dishwasher',
    7,
    '🍽️',
    'helping',
    FALSE,
    NOW(),
    NOW()
  );

-- =============================================
-- Summary
-- =============================================
--
-- Smith Family Chores (default + custom):
-- Default (auto-created by trigger):
--   - Tidy bedroom (10 points)
--   - Finish homework (8 points)
--   - Set / clear the table (5 points)
--   - Feed pet / help pet (6 points)
--   - Help with laundry (7 points)
-- Custom:
--   - Practice piano (12 points)
--   - Water the plants (5 points)
--   - Take out recycling (8 points)
--   - Read for 30 minutes (10 points)
--   - Help sibling with homework (15 points)
--
-- Johnson Family Chores (default + custom):
-- Default (auto-created by trigger):
--   - Tidy bedroom (10 points)
--   - Finish homework (8 points)
--   - Set / clear the table (5 points)
--   - Feed pet / help pet (6 points)
--   - Help with laundry (7 points)
-- Custom:
--   - Walk the dog (10 points)
--   - Vacuum living room (12 points)
--   - Sort and organize toys (8 points)
--   - Practice math facts (10 points)
--   - Make bed (5 points)
--   - Empty dishwasher (7 points)
--
-- =============================================
