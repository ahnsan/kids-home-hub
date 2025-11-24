-- Kids Home Hub - Auth Triggers
-- Migration 004: Supabase Auth Integration Triggers
--
-- This migration creates triggers to integrate Supabase Auth with our
-- application schema. When users sign up via Supabase Auth, corresponding
-- application user records are automatically created.

-- =============================================================================
-- AUTH USER CREATION TRIGGER
-- =============================================================================

-- Function: Handle new auth user creation
-- This function is called when a user signs up via Supabase Auth
-- It creates a corresponding record in our users table
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (
    id,
    email,
    email_verified,
    display_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_auth_user_created IS 'Automatically create app user record when Supabase Auth user is created';

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_created();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Create app user record on signup';

-- =============================================================================
-- AUTH USER UPDATE TRIGGER
-- =============================================================================

-- Function: Handle auth user updates
-- This function syncs changes from auth.users to our users table
CREATE OR REPLACE FUNCTION handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Update users table when auth user is updated
  UPDATE public.users
  SET
    email = NEW.email,
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    display_name = COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      display_name
    ),
    avatar_url = COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      avatar_url
    ),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_auth_user_updated IS 'Sync auth.users updates to app users table';

-- Create trigger on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at OR
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
  )
  EXECUTE FUNCTION handle_auth_user_updated();

COMMENT ON TRIGGER on_auth_user_updated ON auth.users IS 'Sync email and profile updates to app users';

-- =============================================================================
-- AUTH USER DELETION TRIGGER
-- =============================================================================

-- Function: Handle auth user deletion
-- This function is called when a user is deleted from auth.users
-- The CASCADE on the foreign key will automatically delete the user record,
-- but we can use this trigger for any cleanup operations
CREATE OR REPLACE FUNCTION handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion (optional - you could write to an audit table)
  RAISE LOG 'User deleted: % (%)', OLD.email, OLD.id;

  -- Additional cleanup could go here if needed
  -- For example, anonymizing data instead of deleting it

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_auth_user_deleted IS 'Handle cleanup when auth user is deleted';

-- Create trigger on auth.users delete
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_deleted();

COMMENT ON TRIGGER on_auth_user_deleted ON auth.users IS 'Cleanup before user deletion';

-- =============================================================================
-- HOUSEHOLD MEMBERSHIP TRIGGER
-- =============================================================================

-- Function: Auto-add creator as household owner
-- When a household is created, automatically add creator as owner in household_members
-- This ensures every household has at least one owner
CREATE OR REPLACE FUNCTION handle_household_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Add creator as household owner
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (household_id, user_id) DO UPDATE
  SET role = 'owner';

  -- Create default chores for the household
  PERFORM create_default_chores(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_household_created IS 'Auto-add creator as owner and create default chores';

-- Create trigger on households insert
DROP TRIGGER IF EXISTS on_household_created ON households;
CREATE TRIGGER on_household_created
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION handle_household_created();

COMMENT ON TRIGGER on_household_created ON households IS 'Setup household owner and default chores';

-- =============================================================================
-- PREVENT LAST OWNER REMOVAL TRIGGER
-- =============================================================================

-- Function: Prevent removing the last owner from a household
-- This ensures households always have at least one owner
CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  -- Only check if we're deleting or changing an owner
  IF (TG_OP = 'DELETE' AND OLD.role = 'owner') OR
     (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner') THEN

    -- Count remaining owners
    SELECT COUNT(*)
    INTO owner_count
    FROM household_members
    WHERE household_id = COALESCE(NEW.household_id, OLD.household_id)
      AND role = 'owner'
      AND id != OLD.id;

    -- If this is the last owner, prevent the operation
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove or change role of the last owner. Household must have at least one owner.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_last_owner_removal IS 'Ensure households always have at least one owner';

-- Create trigger on household_members delete and update
DROP TRIGGER IF EXISTS check_last_owner_delete ON household_members;
CREATE TRIGGER check_last_owner_delete
  BEFORE DELETE ON household_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();

DROP TRIGGER IF EXISTS check_last_owner_update ON household_members;
CREATE TRIGGER check_last_owner_update
  BEFORE UPDATE ON household_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_owner_removal();

COMMENT ON TRIGGER check_last_owner_delete ON household_members IS 'Prevent removing last owner';
COMMENT ON TRIGGER check_last_owner_update ON household_members IS 'Prevent changing last owner role';

-- =============================================================================
-- CHILD BALANCE VALIDATION TRIGGER
-- =============================================================================

-- Function: Validate child balance updates
-- Ensures balances never go negative (additional safety beyond CHECK constraints)
CREATE OR REPLACE FUNCTION validate_child_balances()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure money balance is not negative
  IF NEW.money_total < 0 THEN
    RAISE EXCEPTION 'Money balance cannot be negative: %', NEW.money_total;
  END IF;

  -- Ensure points balance is not negative
  IF NEW.points_total < 0 THEN
    RAISE EXCEPTION 'Points balance cannot be negative: %', NEW.points_total;
  END IF;

  -- Ensure screen time balance is not negative
  IF NEW.screen_total < 0 THEN
    RAISE EXCEPTION 'Screen time balance cannot be negative: %', NEW.screen_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_child_balances IS 'Additional validation for child balances';

-- Create trigger on children insert and update
DROP TRIGGER IF EXISTS validate_balances_insert ON children;
CREATE TRIGGER validate_balances_insert
  BEFORE INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION validate_child_balances();

DROP TRIGGER IF EXISTS validate_balances_update ON children;
CREATE TRIGGER validate_balances_update
  BEFORE UPDATE OF money_total, points_total, screen_total ON children
  FOR EACH ROW
  EXECUTE FUNCTION validate_child_balances();

COMMENT ON TRIGGER validate_balances_insert ON children IS 'Validate balances on insert';
COMMENT ON TRIGGER validate_balances_update ON children IS 'Validate balances on update';

-- =============================================================================
-- WEEK START CALCULATION TRIGGER
-- =============================================================================

-- Function: Auto-calculate week_start for chore completions
-- Ensures week_start is always set to Monday of the completion week
CREATE OR REPLACE FUNCTION set_week_start()
RETURNS TRIGGER AS $$
BEGIN
  -- Set week_start to Monday of the completion week
  NEW.week_start := DATE_TRUNC('week', NEW.completed_at)::DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_week_start IS 'Auto-calculate week_start (Monday) for chore completions';

-- Create trigger on chore_completions insert and update
DROP TRIGGER IF EXISTS set_chore_week_start ON chore_completions;
CREATE TRIGGER set_chore_week_start
  BEFORE INSERT OR UPDATE OF completed_at ON chore_completions
  FOR EACH ROW
  EXECUTE FUNCTION set_week_start();

COMMENT ON TRIGGER set_chore_week_start ON chore_completions IS 'Auto-set week_start on completion';

-- =============================================================================
-- SESSION TRACKING TRIGGER
-- =============================================================================

-- Function: Update session last_active_at
-- This function can be called to update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_session_activity IS 'Update session last_active_at on access';

-- Note: This trigger is intentionally NOT automatically applied to avoid
-- excessive updates. Instead, applications should call this explicitly
-- via: UPDATE user_sessions SET last_active_at = NOW() WHERE id = ?

-- =============================================================================
-- TRIGGER VERIFICATION
-- =============================================================================

-- Display trigger count
SELECT
  'Auth integration triggers created successfully!' AS message,
  COUNT(*) AS trigger_count
FROM pg_trigger
WHERE tgname LIKE 'on_%' OR tgname LIKE 'check_%' OR tgname LIKE 'set_%' OR tgname LIKE 'validate_%';

-- Display triggers by table
SELECT
  tgrelid::regclass AS table_name,
  tgname AS trigger_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname LIKE 'on_%' OR tgname LIKE 'check_%' OR tgname LIKE 'set_%' OR tgname LIKE 'validate_%'
ORDER BY tgrelid::regclass::text, tgname;
