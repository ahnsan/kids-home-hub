-- Kids Home Hub - Helper Functions
-- Migration 003: Utility Functions for Common Operations
--
-- This migration creates reusable SQL functions for common operations
-- including user management, household setup, and data cleanup.

-- =============================================================================
-- USER MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function: Get or create user (for auth integration)
-- This function is called by the auth trigger to create user records
CREATE OR REPLACE FUNCTION get_or_create_user(
  user_id UUID,
  user_email TEXT,
  is_verified BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Try to find existing user
  SELECT id INTO existing_user_id
  FROM users
  WHERE id = user_id OR email = user_email;

  -- If found, return the ID
  IF existing_user_id IS NOT NULL THEN
    -- Update email verification if needed
    IF is_verified THEN
      UPDATE users
      SET email_verified = TRUE,
          updated_at = NOW()
      WHERE id = existing_user_id;
    END IF;

    RETURN existing_user_id;
  END IF;

  -- If not found, create new user
  INSERT INTO users (id, email, email_verified)
  VALUES (user_id, user_email, is_verified)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW()
  RETURNING id INTO existing_user_id;

  RETURN existing_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_user IS 'Get or create user record (called by auth trigger)';

-- =============================================================================
-- HOUSEHOLD MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function: Create household with owner membership
-- This function creates a household and automatically adds the creator as owner
CREATE OR REPLACE FUNCTION create_household(
  user_id UUID,
  household_name TEXT DEFAULT 'My Household',
  household_currency TEXT DEFAULT 'GBP'
)
RETURNS UUID AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create the household
  INSERT INTO households (name, created_by, currency)
  VALUES (household_name, user_id, household_currency)
  RETURNING id INTO new_household_id;

  -- Add creator as owner member
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (new_household_id, user_id, 'owner');

  -- Create default chores for the household
  PERFORM create_default_chores(new_household_id);

  RETURN new_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_household IS 'Create household and add creator as owner with default chores';

-- Function: Create default chores for a household
-- This creates a starter set of 5 common chores
CREATE OR REPLACE FUNCTION create_default_chores(household_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO chores (household_id, label, points, icon, category, is_default)
  VALUES
    (household_uuid, 'Tidy bedroom', 10, '🛏️', 'cleaning', TRUE),
    (household_uuid, 'Finish homework', 8, '📚', 'homework', TRUE),
    (household_uuid, 'Set / clear the table', 5, '🍽️', 'helping', TRUE),
    (household_uuid, 'Feed pet / help pet', 6, '🐕', 'pets', TRUE),
    (household_uuid, 'Help with laundry', 7, '👕', 'helping', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_chores IS 'Create 5 default chores for a household';

-- Function: Add household member
-- This function adds a user to a household with proper role validation
CREATE OR REPLACE FUNCTION add_household_member(
  household_uuid UUID,
  new_user_id UUID,
  member_role TEXT DEFAULT 'parent',
  inviter_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_member_id UUID;
BEGIN
  -- Validate role
  IF member_role NOT IN ('owner', 'parent', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be owner, parent, or viewer', member_role;
  END IF;

  -- Insert the member
  INSERT INTO household_members (household_id, user_id, role, invited_by)
  VALUES (household_uuid, new_user_id, member_role, inviter_user_id)
  ON CONFLICT (household_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        invitation_status = 'active'
  RETURNING id INTO new_member_id;

  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_household_member IS 'Add a member to a household with role validation';

-- =============================================================================
-- CHILD MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function: Add child to household
-- This creates a child profile with initial zero balances
CREATE OR REPLACE FUNCTION add_child(
  household_uuid UUID,
  child_name TEXT,
  child_avatar TEXT DEFAULT NULL,
  child_dob DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_child_id UUID;
  max_order INTEGER;
BEGIN
  -- Get max display order
  SELECT COALESCE(MAX(display_order), -1) + 1
  INTO max_order
  FROM children
  WHERE household_id = household_uuid;

  -- Insert child
  INSERT INTO children (
    household_id,
    name,
    avatar,
    date_of_birth,
    display_order
  )
  VALUES (
    household_uuid,
    child_name,
    child_avatar,
    child_dob,
    max_order
  )
  RETURNING id INTO new_child_id;

  RETURN new_child_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_child IS 'Add a child to a household with auto display ordering';

-- =============================================================================
-- TRANSACTION FUNCTIONS
-- =============================================================================

-- Function: Record chore completion with transaction
-- This function atomically records a chore completion and updates balances
CREATE OR REPLACE FUNCTION complete_chore(
  completion_child_id UUID,
  completion_chore_id UUID,
  completion_created_by UUID,
  completion_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  completion_id UUID;
  chore_points INTEGER;
  chore_name TEXT;
  week_start_date DATE;
BEGIN
  -- Get chore details
  SELECT points, label
  INTO chore_points, chore_name
  FROM chores
  WHERE id = completion_chore_id;

  IF chore_points IS NULL THEN
    RAISE EXCEPTION 'Chore not found: %', completion_chore_id;
  END IF;

  -- Calculate week start (Monday)
  week_start_date := DATE_TRUNC('week', NOW())::DATE;

  -- Insert chore completion
  INSERT INTO chore_completions (
    child_id,
    chore_id,
    chore_label,
    points_earned,
    week_start,
    created_by,
    notes
  )
  VALUES (
    completion_child_id,
    completion_chore_id,
    chore_name,
    chore_points,
    week_start_date,
    completion_created_by,
    completion_notes
  )
  RETURNING id INTO completion_id;

  -- Update child's points balance
  UPDATE children
  SET points_total = points_total + chore_points,
      updated_at = NOW()
  WHERE id = completion_child_id;

  -- Record transaction
  INSERT INTO transactions (
    child_id,
    type,
    action,
    amount,
    reason,
    created_by
  )
  VALUES (
    completion_child_id,
    'points',
    'earn',
    chore_points,
    'Completed: ' || chore_name,
    completion_created_by
  );

  RETURN completion_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_chore IS 'Record chore completion and update child points atomically';

-- Function: Add/deduct money with transaction
CREATE OR REPLACE FUNCTION adjust_money(
  transaction_child_id UUID,
  transaction_amount DECIMAL(10, 2),
  transaction_action TEXT, -- 'add' or 'deduct'
  transaction_reason TEXT,
  transaction_created_by UUID,
  transaction_currency TEXT DEFAULT 'GBP'
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
  amount_change DECIMAL(10, 2);
BEGIN
  -- Validate action
  IF transaction_action NOT IN ('add', 'deduct') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be add or deduct', transaction_action;
  END IF;

  -- Calculate amount change (negative for deduct)
  amount_change := CASE
    WHEN transaction_action = 'add' THEN transaction_amount
    WHEN transaction_action = 'deduct' THEN -transaction_amount
  END;

  -- Check if deduction would make balance negative
  IF transaction_action = 'deduct' THEN
    PERFORM 1 FROM children
    WHERE id = transaction_child_id
      AND money_total >= transaction_amount;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient balance for deduction';
    END IF;
  END IF;

  -- Update child's money balance
  UPDATE children
  SET money_total = money_total + amount_change,
      updated_at = NOW()
  WHERE id = transaction_child_id;

  -- Record transaction
  INSERT INTO transactions (
    child_id,
    type,
    action,
    amount,
    currency,
    reason,
    created_by
  )
  VALUES (
    transaction_child_id,
    'money',
    transaction_action,
    transaction_amount,
    transaction_currency,
    transaction_reason,
    transaction_created_by
  )
  RETURNING id INTO transaction_id;

  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION adjust_money IS 'Add or deduct money with balance validation';

-- Function: Add/deduct screen time with transaction
CREATE OR REPLACE FUNCTION adjust_screen_time(
  transaction_child_id UUID,
  transaction_minutes INTEGER,
  transaction_action TEXT, -- 'add' or 'deduct'
  transaction_reason TEXT,
  transaction_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
  minutes_change INTEGER;
BEGIN
  -- Validate action
  IF transaction_action NOT IN ('add', 'deduct') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be add or deduct', transaction_action;
  END IF;

  -- Calculate minutes change (negative for deduct)
  minutes_change := CASE
    WHEN transaction_action = 'add' THEN transaction_minutes
    WHEN transaction_action = 'deduct' THEN -transaction_minutes
  END;

  -- Check if deduction would make balance negative
  IF transaction_action = 'deduct' THEN
    PERFORM 1 FROM children
    WHERE id = transaction_child_id
      AND screen_total >= transaction_minutes;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient screen time for deduction';
    END IF;
  END IF;

  -- Update child's screen time balance
  UPDATE children
  SET screen_total = screen_total + minutes_change,
      updated_at = NOW()
  WHERE id = transaction_child_id;

  -- Record transaction
  INSERT INTO transactions (
    child_id,
    type,
    action,
    amount,
    reason,
    created_by
  )
  VALUES (
    transaction_child_id,
    'screen_time',
    transaction_action,
    transaction_minutes,
    transaction_reason,
    transaction_created_by
  )
  RETURNING id INTO transaction_id;

  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION adjust_screen_time IS 'Add or deduct screen time with balance validation';

-- =============================================================================
-- CLEANUP & MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function: Cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE last_active_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_sessions IS 'Delete inactive sessions older than specified days';

-- Function: Archive old transactions
CREATE OR REPLACE FUNCTION archive_old_transactions(months_to_keep INTEGER DEFAULT 6)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- In a full implementation, this would move to an archive table
  -- For now, we just return the count that would be archived
  SELECT COUNT(*)
  INTO archived_count
  FROM transactions
  WHERE created_at < NOW() - (months_to_keep || ' months')::INTERVAL;

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_transactions IS 'Count transactions older than specified months (for archival)';

-- =============================================================================
-- ANALYTICS HELPER FUNCTIONS
-- =============================================================================

-- Function: Get child weekly stats
CREATE OR REPLACE FUNCTION get_child_weekly_stats(
  stats_child_id UUID,
  weeks_back INTEGER DEFAULT 4
)
RETURNS TABLE (
  week_start DATE,
  chores_completed BIGINT,
  points_earned BIGINT,
  money_added NUMERIC,
  screen_time_added INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH weekly_data AS (
    SELECT DATE_TRUNC('week', completed_at)::DATE AS week
    FROM chore_completions
    WHERE child_id = stats_child_id
      AND completed_at >= NOW() - (weeks_back || ' weeks')::INTERVAL
    UNION
    SELECT DATE_TRUNC('week', created_at)::DATE AS week
    FROM transactions
    WHERE child_id = stats_child_id
      AND created_at >= NOW() - (weeks_back || ' weeks')::INTERVAL
  ),
  week_series AS (
    SELECT DISTINCT week FROM weekly_data
  )
  SELECT
    ws.week,
    COALESCE(COUNT(DISTINCT cc.id), 0) AS chores_completed,
    COALESCE(SUM(cc.points_earned), 0) AS points_earned,
    COALESCE(SUM(CASE WHEN t.type = 'money' AND t.action = 'add' THEN t.amount ELSE 0 END), 0) AS money_added,
    COALESCE(SUM(CASE WHEN t.type = 'screen_time' AND t.action = 'add' THEN t.amount::INTEGER ELSE 0 END), 0) AS screen_time_added
  FROM week_series ws
  LEFT JOIN chore_completions cc ON DATE_TRUNC('week', cc.completed_at)::DATE = ws.week
    AND cc.child_id = stats_child_id
  LEFT JOIN transactions t ON DATE_TRUNC('week', t.created_at)::DATE = ws.week
    AND t.child_id = stats_child_id
  GROUP BY ws.week
  ORDER BY ws.week DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_child_weekly_stats IS 'Get weekly activity stats for a child';

-- Function: Get household leaderboard
CREATE OR REPLACE FUNCTION get_household_leaderboard(
  leaderboard_household_id UUID,
  time_period TEXT DEFAULT 'week' -- 'week', 'month', 'all_time'
)
RETURNS TABLE (
  child_id UUID,
  child_name TEXT,
  child_avatar TEXT,
  points_earned BIGINT,
  chores_completed BIGINT
) AS $$
DECLARE
  time_filter TIMESTAMPTZ;
BEGIN
  -- Determine time filter
  time_filter := CASE time_period
    WHEN 'week' THEN NOW() - INTERVAL '7 days'
    WHEN 'month' THEN NOW() - INTERVAL '30 days'
    ELSE '1970-01-01'::TIMESTAMPTZ -- all time
  END;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.avatar,
    COALESCE(SUM(cc.points_earned), 0) AS points_earned,
    COUNT(cc.id) AS chores_completed
  FROM children c
  LEFT JOIN chore_completions cc ON cc.child_id = c.id
    AND cc.completed_at >= time_filter
  WHERE c.household_id = leaderboard_household_id
    AND c.is_archived = FALSE
  GROUP BY c.id, c.name, c.avatar
  ORDER BY points_earned DESC, chores_completed DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_household_leaderboard IS 'Get points leaderboard for a household';

-- =============================================================================
-- AUTOMATIC TRIGGER FUNCTIONS
-- =============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Trigger function to auto-update updated_at timestamp';

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_households_updated_at ON households;
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_children_updated_at ON children;
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chores_updated_at ON chores;
CREATE TRIGGER update_chores_updated_at
  BEFORE UPDATE ON chores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTION VERIFICATION
-- =============================================================================

-- Display function count
SELECT
  'Helper functions created successfully!' AS message,
  COUNT(*) AS function_count
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f';
