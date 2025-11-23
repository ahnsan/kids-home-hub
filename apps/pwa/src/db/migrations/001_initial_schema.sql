-- Kids Home Hub - Initial Database Schema
-- Created: 2025-11-23
-- Description: Core tables for multi-household kids management app

-- =============================================================================
-- 1. CORE TABLES
-- =============================================================================

-- Users table (will be managed by Neon Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (link users to households with roles)
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent', -- 'parent' or 'child'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Children table (profiles for kids in households)
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  money_total NUMERIC(10, 2) DEFAULT 0,
  points_total INTEGER DEFAULT 0,
  screen_total INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  points INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table (for money, points, screen time)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('money', 'points', 'screen_time')),
  action TEXT NOT NULL CHECK (action IN ('add', 'deduct', 'redeem')),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'GBP', -- for money transactions
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chore completions table
CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Children indexes
CREATE INDEX IF NOT EXISTS idx_children_household ON children(household_id);

-- Chores indexes
CREATE INDEX IF NOT EXISTS idx_chores_household ON chores(household_id);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_child ON transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Chore completions indexes
CREATE INDEX IF NOT EXISTS idx_chore_completions_child ON chore_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_date ON chore_completions(completed_at DESC);

-- Household members indexes
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);

-- =============================================================================
-- 3. FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

-- Triggers for updated_at columns
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
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be defined after integrating Neon Auth
-- The policies will use the authenticated user context to restrict access
-- to only their household data.

-- Example policy structure (to be implemented with Neon Auth):
-- CREATE POLICY households_member_policy ON households
--   FOR ALL
--   USING (
--     id IN (
--       SELECT household_id FROM household_members
--       WHERE user_id = auth.user_id()
--     )
--   );

-- =============================================================================
-- 6. DEFAULT DATA
-- =============================================================================

-- Function to seed default chores for a household
CREATE OR REPLACE FUNCTION seed_default_chores(p_household_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO chores (household_id, label, points, is_default) VALUES
    (p_household_id, 'Tidy bedroom', 10, TRUE),
    (p_household_id, 'Finish homework', 8, TRUE),
    (p_household_id, 'Set / clear the table', 5, TRUE),
    (p_household_id, 'Feed pet / help pet', 6, TRUE),
    (p_household_id, 'Help with laundry', 7, TRUE)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================

-- To seed default chores for a household, call:
-- SELECT seed_default_chores('household-uuid-here');
