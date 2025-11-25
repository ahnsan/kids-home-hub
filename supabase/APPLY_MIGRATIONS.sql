-- ============================================================================
-- Kids Home Hub - Complete Database Migration Script
-- ============================================================================
--
-- This script creates the complete database schema for Kids Home Hub.
-- Run this script in your Supabase SQL Editor to set up the database.
--
-- INSTRUCTIONS:
-- 1. Log in to your Supabase Dashboard: https://qojanjzukgkkrqmnyaai.supabase.co
-- 2. Navigate to SQL Editor (left sidebar)
-- 3. Create a new query
-- 4. Copy and paste this entire script
-- 5. Click "Run" to execute
-- 6. Verify success with the verification script
--
-- IMPORTANT: This script is idempotent - safe to run multiple times
-- ============================================================================

-- =============================================================================
-- MIGRATION 001: INITIAL SCHEMA - Core Tables
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON TABLE users IS 'Application user profiles linked to Supabase auth.users';
COMMENT ON COLUMN users.id IS 'References auth.users(id) - Supabase Auth user ID';

-- User sessions table (for multi-device tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT,
  device_name TEXT,
  device_type TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON user_sessions(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON user_sessions(last_active_at DESC);

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  currency TEXT DEFAULT 'GBP',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);
CREATE INDEX IF NOT EXISTS idx_households_updated ON households(updated_at DESC);

-- Household members table
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('owner', 'parent', 'viewer')),
  invitation_status TEXT DEFAULT 'active' CHECK (invitation_status IN ('pending', 'active', 'inactive')),
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_role ON household_members(household_id, role);

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  date_of_birth DATE,
  money_total DECIMAL(10, 2) DEFAULT 0.00 CHECK (money_total >= 0),
  points_total INTEGER DEFAULT 0 CHECK (points_total >= 0),
  screen_total INTEGER DEFAULT 0 CHECK (screen_total >= 0),
  display_order INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_household ON children(household_id);
CREATE INDEX IF NOT EXISTS idx_children_household_active ON children(household_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_children_updated ON children(updated_at DESC);

COMMENT ON TABLE children IS 'Child profiles with money, points, and screen time balances';

-- Chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL CHECK (points >= 0),
  icon TEXT,
  category TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chores_household ON chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_household_active ON chores(household_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_chores_category ON chores(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chores_is_default ON chores(household_id, is_default);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('money', 'points', 'screen_time')),
  action TEXT NOT NULL CHECK (action IN ('add', 'deduct', 'redeem', 'earn')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT,
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  device_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_child ON transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_child_type ON transactions(child_id, type, created_at DESC);

-- Chore completions table
CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  chore_id UUID REFERENCES chores(id) ON DELETE SET NULL,
  chore_label TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  week_start DATE NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  notes TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_chore_completions_child ON chore_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_chore ON chore_completions(chore_id) WHERE chore_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chore_completions_week ON chore_completions(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_chore_completions_completed ON chore_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_chore_completions_child_week ON chore_completions(child_id, week_start DESC);

-- =============================================================================
-- MIGRATION 002: ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS users_select_household_members ON users;
CREATE POLICY users_select_household_members ON users FOR SELECT USING (
  id IN (
    SELECT DISTINCT user_id FROM household_members
    WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  )
);

-- User sessions policies
DROP POLICY IF EXISTS sessions_select_own ON user_sessions;
CREATE POLICY sessions_select_own ON user_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS sessions_insert_own ON user_sessions;
CREATE POLICY sessions_insert_own ON user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS sessions_update_own ON user_sessions;
CREATE POLICY sessions_update_own ON user_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS sessions_delete_own ON user_sessions;
CREATE POLICY sessions_delete_own ON user_sessions FOR DELETE USING (auth.uid() = user_id);

-- Households policies
DROP POLICY IF EXISTS households_select_member ON households;
CREATE POLICY households_select_member ON households FOR SELECT USING (
  created_by = auth.uid() OR
  id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS households_insert_authenticated ON households;
CREATE POLICY households_insert_authenticated ON households FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND created_by = auth.uid()
);

DROP POLICY IF EXISTS households_update_owner ON households;
CREATE POLICY households_update_owner ON households FOR UPDATE USING (
  id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
) WITH CHECK (
  id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
);

DROP POLICY IF EXISTS households_delete_owner ON households;
CREATE POLICY households_delete_owner ON households FOR DELETE USING (
  id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
);

-- Household members policies
DROP POLICY IF EXISTS household_members_select_same_household ON household_members;
CREATE POLICY household_members_select_same_household ON household_members FOR SELECT USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS household_members_insert_owner_parent ON household_members;
CREATE POLICY household_members_insert_owner_parent ON household_members FOR INSERT WITH CHECK (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
);

DROP POLICY IF EXISTS household_members_update_owner ON household_members;
CREATE POLICY household_members_update_owner ON household_members FOR UPDATE USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
) WITH CHECK (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
);

DROP POLICY IF EXISTS household_members_delete_owner_or_self ON household_members;
CREATE POLICY household_members_delete_owner_or_self ON household_members FOR DELETE USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
  OR user_id = auth.uid()
);

-- Children policies
DROP POLICY IF EXISTS children_select_household_member ON children;
CREATE POLICY children_select_household_member ON children FOR SELECT USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS children_insert_owner_parent ON children;
CREATE POLICY children_insert_owner_parent ON children FOR INSERT WITH CHECK (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
);

DROP POLICY IF EXISTS children_update_owner_parent ON children;
CREATE POLICY children_update_owner_parent ON children FOR UPDATE USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
) WITH CHECK (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
);

DROP POLICY IF EXISTS children_delete_owner_parent ON children;
CREATE POLICY children_delete_owner_parent ON children FOR DELETE USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
);

-- Chores policies
DROP POLICY IF EXISTS chores_select_household_member ON chores;
CREATE POLICY chores_select_household_member ON chores FOR SELECT USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS chores_insert_owner_parent ON chores;
CREATE POLICY chores_insert_owner_parent ON chores FOR INSERT WITH CHECK (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
);

DROP POLICY IF EXISTS chores_update_owner_parent ON chores;
CREATE POLICY chores_update_owner_parent ON chores FOR UPDATE USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
) WITH CHECK (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
);

DROP POLICY IF EXISTS chores_delete_owner_parent ON chores;
CREATE POLICY chores_delete_owner_parent ON chores FOR DELETE USING (
  household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent'))
);

-- Transactions policies
DROP POLICY IF EXISTS transactions_select_household_member ON transactions;
CREATE POLICY transactions_select_household_member ON transactions FOR SELECT USING (
  child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS transactions_insert_owner_parent ON transactions;
CREATE POLICY transactions_insert_owner_parent ON transactions FOR INSERT WITH CHECK (
  child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  ) AND created_by = auth.uid()
);

DROP POLICY IF EXISTS transactions_update_own ON transactions;
CREATE POLICY transactions_update_own ON transactions FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS transactions_delete_own_recent ON transactions;
CREATE POLICY transactions_delete_own_recent ON transactions FOR DELETE USING (
  created_by = auth.uid() AND created_at > NOW() - INTERVAL '24 hours'
);

-- Chore completions policies
DROP POLICY IF EXISTS chore_completions_select_household_member ON chore_completions;
CREATE POLICY chore_completions_select_household_member ON chore_completions FOR SELECT USING (
  child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS chore_completions_insert_owner_parent ON chore_completions;
CREATE POLICY chore_completions_insert_owner_parent ON chore_completions FOR INSERT WITH CHECK (
  child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  ) AND created_by = auth.uid()
);

DROP POLICY IF EXISTS chore_completions_update_own ON chore_completions;
CREATE POLICY chore_completions_update_own ON chore_completions FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS chore_completions_delete_own_recent ON chore_completions;
CREATE POLICY chore_completions_delete_own_recent ON chore_completions FOR DELETE USING (
  created_by = auth.uid() AND completed_at > NOW() - INTERVAL '24 hours'
);

-- =============================================================================
-- MIGRATION 003: HELPER FUNCTIONS
-- =============================================================================

-- Function: Get or create user
CREATE OR REPLACE FUNCTION get_or_create_user(
  user_id UUID,
  user_email TEXT,
  is_verified BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id FROM users WHERE id = user_id OR email = user_email;

  IF existing_user_id IS NOT NULL THEN
    IF is_verified THEN
      UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = existing_user_id;
    END IF;
    RETURN existing_user_id;
  END IF;

  INSERT INTO users (id, email, email_verified)
  VALUES (user_id, user_email, is_verified)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, email_verified = EXCLUDED.email_verified, updated_at = NOW()
  RETURNING id INTO existing_user_id;

  RETURN existing_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create default chores
CREATE OR REPLACE FUNCTION create_default_chores(household_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO chores (household_id, label, points, icon, category, is_default)
  VALUES
    (household_uuid, 'Tidy bedroom', 10, '🛏️', 'cleaning', TRUE),
    (household_uuid, 'Finish homework', 8, '📚', 'homework', TRUE),
    (household_uuid, 'Set / clear the table', 5, '🍽️', 'helping', TRUE),
    (household_uuid, 'Feed pet / help pet', 6, '🐕', 'pets', TRUE),
    (household_uuid, 'Help with laundry', 7, '👕', 'helping', TRUE)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create household with owner
CREATE OR REPLACE FUNCTION create_household(
  user_id UUID,
  household_name TEXT DEFAULT 'My Household',
  household_currency TEXT DEFAULT 'GBP'
)
RETURNS UUID AS $$
DECLARE
  new_household_id UUID;
BEGIN
  INSERT INTO households (name, created_by, currency)
  VALUES (household_name, user_id, household_currency)
  RETURNING id INTO new_household_id;

  INSERT INTO household_members (household_id, user_id, role)
  VALUES (new_household_id, user_id, 'owner');

  PERFORM create_default_chores(new_household_id);

  RETURN new_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete chore
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
  SELECT points, label INTO chore_points, chore_name FROM chores WHERE id = completion_chore_id;

  IF chore_points IS NULL THEN
    RAISE EXCEPTION 'Chore not found: %', completion_chore_id;
  END IF;

  week_start_date := DATE_TRUNC('week', NOW())::DATE;

  INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, week_start, created_by, notes)
  VALUES (completion_child_id, completion_chore_id, chore_name, chore_points, week_start_date, completion_created_by, completion_notes)
  RETURNING id INTO completion_id;

  UPDATE children SET points_total = points_total + chore_points, updated_at = NOW() WHERE id = completion_child_id;

  INSERT INTO transactions (child_id, type, action, amount, reason, created_by)
  VALUES (completion_child_id, 'points', 'earn', chore_points, 'Completed: ' || chore_name, completion_created_by);

  RETURN completion_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Adjust money
CREATE OR REPLACE FUNCTION adjust_money(
  transaction_child_id UUID,
  transaction_amount DECIMAL(10, 2),
  transaction_action TEXT,
  transaction_reason TEXT,
  transaction_created_by UUID,
  transaction_currency TEXT DEFAULT 'GBP'
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
  amount_change DECIMAL(10, 2);
BEGIN
  IF transaction_action NOT IN ('add', 'deduct') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be add or deduct', transaction_action;
  END IF;

  amount_change := CASE WHEN transaction_action = 'add' THEN transaction_amount ELSE -transaction_amount END;

  IF transaction_action = 'deduct' THEN
    PERFORM 1 FROM children WHERE id = transaction_child_id AND money_total >= transaction_amount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient balance for deduction';
    END IF;
  END IF;

  UPDATE children SET money_total = money_total + amount_change, updated_at = NOW() WHERE id = transaction_child_id;

  INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by)
  VALUES (transaction_child_id, 'money', transaction_action, transaction_amount, transaction_currency, transaction_reason, transaction_created_by)
  RETURNING id INTO transaction_id;

  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Adjust screen time
CREATE OR REPLACE FUNCTION adjust_screen_time(
  transaction_child_id UUID,
  transaction_minutes INTEGER,
  transaction_action TEXT,
  transaction_reason TEXT,
  transaction_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
  minutes_change INTEGER;
BEGIN
  IF transaction_action NOT IN ('add', 'deduct') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be add or deduct', transaction_action;
  END IF;

  minutes_change := CASE WHEN transaction_action = 'add' THEN transaction_minutes ELSE -transaction_minutes END;

  IF transaction_action = 'deduct' THEN
    PERFORM 1 FROM children WHERE id = transaction_child_id AND screen_total >= transaction_minutes;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient screen time for deduction';
    END IF;
  END IF;

  UPDATE children SET screen_total = screen_total + minutes_change, updated_at = NOW() WHERE id = transaction_child_id;

  INSERT INTO transactions (child_id, type, action, amount, reason, created_by)
  VALUES (transaction_child_id, 'screen_time', transaction_action, transaction_minutes, transaction_reason, transaction_created_by)
  RETURNING id INTO transaction_id;

  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION 004: TRIGGERS
-- =============================================================================

-- Auth user creation trigger
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, email_verified, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_created();

-- Auth user update trigger
CREATE OR REPLACE FUNCTION handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET
    email = NEW.email,
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', display_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Household creation trigger
CREATE OR REPLACE FUNCTION handle_household_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (household_id, user_id) DO UPDATE SET role = 'owner';

  PERFORM create_default_chores(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_household_created ON households;
CREATE TRIGGER on_household_created
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION handle_household_created();

-- Prevent last owner removal trigger
CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'owner') OR
     (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner') THEN

    SELECT COUNT(*) INTO owner_count
    FROM household_members
    WHERE household_id = COALESCE(NEW.household_id, OLD.household_id)
      AND role = 'owner'
      AND id != OLD.id;

    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove or change role of the last owner';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

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

-- Child balance validation trigger
CREATE OR REPLACE FUNCTION validate_child_balances()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.money_total < 0 THEN
    RAISE EXCEPTION 'Money balance cannot be negative: %', NEW.money_total;
  END IF;
  IF NEW.points_total < 0 THEN
    RAISE EXCEPTION 'Points balance cannot be negative: %', NEW.points_total;
  END IF;
  IF NEW.screen_total < 0 THEN
    RAISE EXCEPTION 'Screen time balance cannot be negative: %', NEW.screen_total;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Week start calculation trigger
CREATE OR REPLACE FUNCTION set_week_start()
RETURNS TRIGGER AS $$
BEGIN
  NEW.week_start := DATE_TRUNC('week', NEW.completed_at)::DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_chore_week_start ON chore_completions;
CREATE TRIGGER set_chore_week_start
  BEFORE INSERT OR UPDATE OF completed_at ON chore_completions
  FOR EACH ROW
  EXECUTE FUNCTION set_week_start();

-- Updated_at triggers
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
-- MIGRATION COMPLETE
-- =============================================================================

SELECT 'Database migration completed successfully!' AS status;
