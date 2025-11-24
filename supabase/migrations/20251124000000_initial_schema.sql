-- =============================================
-- Kids Home Hub - Supabase Schema Migration
-- Initial database schema for Supabase
-- Migration: 20251124000000
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USER PROFILES (Optional - for extra metadata)
-- =============================================
-- Note: auth.users is managed by Supabase
-- Only create this if you need additional user data beyond what auth.users provides

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HOUSEHOLDS & MEMBERS
-- =============================================

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent', -- 'owner', 'parent', 'viewer'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- =============================================
-- CHILDREN & CHORES
-- =============================================

CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  money_total DECIMAL(10, 2) DEFAULT 0.00,
  points_total INTEGER DEFAULT 0,
  screen_total INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  points INTEGER NOT NULL,
  icon TEXT,
  category TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRANSACTIONS & COMPLETIONS
-- =============================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('money', 'points', 'screen_time')),
  action TEXT NOT NULL CHECK (action IN ('add', 'deduct', 'redeem', 'earn')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES chores(id) ON DELETE SET NULL,
  chore_label TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  week_start DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Households
CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);

-- Children & Chores
CREATE INDEX IF NOT EXISTS idx_children_household ON children(household_id);
CREATE INDEX IF NOT EXISTS idx_children_updated ON children(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chores_household ON chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_category ON chores(category) WHERE category IS NOT NULL;

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_child ON transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Completions
CREATE INDEX IF NOT EXISTS idx_chore_completions_child ON chore_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_week ON chore_completions(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_chore_completions_date ON chore_completions(completed_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at
  BEFORE UPDATE ON chores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Create default chores for a household
CREATE OR REPLACE FUNCTION create_default_chores(household_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO chores (household_id, label, points, icon, category, is_default) VALUES
    (household_uuid, 'Tidy bedroom', 10, '🛏️', 'cleaning', TRUE),
    (household_uuid, 'Finish homework', 8, '📚', 'homework', TRUE),
    (household_uuid, 'Set / clear the table', 5, '🍽️', 'helping', TRUE),
    (household_uuid, 'Feed pet / help pet', 6, '🐕', 'pets', TRUE),
    (household_uuid, 'Help with laundry', 7, '👕', 'helping', TRUE);
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- VIEWS
-- =============================================

CREATE OR REPLACE VIEW household_summary AS
SELECT
  h.id AS household_id,
  h.name AS household_name,
  h.created_by,
  COUNT(DISTINCT c.id) AS children_count,
  COUNT(DISTINCT ch.id) AS chores_count,
  h.created_at,
  h.updated_at
FROM households h
LEFT JOIN children c ON c.household_id = h.id
LEFT JOIN chores ch ON ch.household_id = h.id
GROUP BY h.id, h.name, h.created_by, h.created_at, h.updated_at;

CREATE OR REPLACE VIEW child_balances AS
SELECT
  c.id,
  c.household_id,
  c.name,
  c.avatar,
  c.money_total,
  c.points_total,
  c.screen_total,
  (
    SELECT COUNT(*)
    FROM chore_completions cc
    WHERE cc.child_id = c.id
      AND cc.completed_at > NOW() - INTERVAL '7 days'
  ) AS chores_this_week,
  (
    SELECT SUM(points_earned)
    FROM chore_completions cc
    WHERE cc.child_id = c.id
      AND cc.completed_at > NOW() - INTERVAL '7 days'
  ) AS points_this_week,
  c.updated_at AS last_updated
FROM children c;
