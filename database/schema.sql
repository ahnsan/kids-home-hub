-- Kids Home Hub - Neon PostgreSQL Schema
-- Multi-Device Sync Database
--
-- Run this file against your Neon database to create all tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS & AUTHENTICATION
-- =============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic link tokens table
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device_id TEXT,
  device_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- HOUSEHOLDS & MEMBERS
-- =============================================================================

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (for multi-parent households)
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent', -- 'owner', 'parent', 'viewer'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- =============================================================================
-- CHILDREN & CHORES
-- =============================================================================

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT, -- Emoji or image URL
  money_total DECIMAL(10, 2) DEFAULT 0.00,
  points_total INTEGER DEFAULT 0,
  screen_total INTEGER DEFAULT 0, -- minutes
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  points INTEGER NOT NULL,
  icon TEXT, -- Emoji icon
  category TEXT, -- 'cleaning', 'homework', 'pets', 'helping', etc.
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TRANSACTIONS & COMPLETIONS
-- =============================================================================

-- Transactions table (unified for money, points, screen time)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('money', 'points', 'screen_time')),
  action TEXT NOT NULL CHECK (action IN ('add', 'deduct', 'redeem', 'earn')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT, -- 'GBP', 'AUD', etc. (for money transactions)
  reason TEXT,
  created_by UUID REFERENCES users(id),
  device_id TEXT, -- For tracking which device created it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chore completions table
CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES chores(id) ON DELETE SET NULL,
  chore_label TEXT NOT NULL, -- Denormalized for history
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  week_start DATE NOT NULL, -- For weekly aggregation
  created_by UUID REFERENCES users(id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Auth & Users
CREATE INDEX IF NOT EXISTS idx_magic_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_expires ON magic_link_tokens(expires_at) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

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

-- Chore Completions
CREATE INDEX IF NOT EXISTS idx_chore_completions_child ON chore_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_week ON chore_completions(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_chore_completions_date ON chore_completions(completed_at DESC);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all user-facing tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added based on your auth implementation
-- These are examples and need to be adapted for your JWT validation

-- Example policy for households (commented out until auth context is set up):
/*
CREATE POLICY households_access_policy ON households
  FOR ALL
  USING (
    created_by = current_setting('app.current_user_id')::UUID OR
    id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );

CREATE POLICY children_access_policy ON children
  FOR ALL
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = current_setting('app.current_user_id')::UUID
      UNION
      SELECT household_id FROM household_members WHERE user_id = current_setting('app.current_user_id')::UUID
    )
  );
*/

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM magic_link_tokens WHERE expires_at < NOW();
  DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user by email
CREATE OR REPLACE FUNCTION get_or_create_user(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Try to find existing user
  SELECT id INTO user_id FROM users WHERE email = user_email;

  -- If not found, create new user
  IF user_id IS NULL THEN
    INSERT INTO users (email) VALUES (user_email) RETURNING id INTO user_id;
  END IF;

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEED DEFAULT CHORES (per household)
-- =============================================================================

-- Function to create default chores for a household
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

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View: Household summary
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

-- View: Child balances with recent activity
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

-- =============================================================================
-- MAINTENANCE
-- =============================================================================

-- Create a scheduled job to clean up expired tokens (run daily)
-- Note: This would be set up using pg_cron or external scheduler
-- Example: SELECT cleanup_expired_tokens();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify indexes created
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify triggers created
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- =============================================================================

-- Uncomment to create test data:
/*
-- Create test user
INSERT INTO users (email, email_verified)
VALUES ('test@example.com', TRUE)
RETURNING id AS test_user_id \gset

-- Create test household
INSERT INTO households (name, created_by)
VALUES ('Test Family', :'test_user_id')
RETURNING id AS test_household_id \gset

-- Add household member
INSERT INTO household_members (household_id, user_id, role)
VALUES (:'test_household_id', :'test_user_id', 'owner');

-- Create default chores
SELECT create_default_chores(:'test_household_id');

-- Create test children
INSERT INTO children (household_id, name, avatar, money_total, points_total, screen_total) VALUES
  (:'test_household_id', 'Emma', '👧', 25.50, 120, 180),
  (:'test_household_id', 'Oliver', '👦', 18.75, 95, 150);

-- Create sample transactions
INSERT INTO transactions (child_id, type, action, amount, reason, created_by)
SELECT
  c.id,
  'points',
  'earn',
  10,
  'Completed homework',
  :'test_user_id'
FROM children c WHERE c.household_id = :'test_household_id';
*/

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

-- Display summary
SELECT
  'Database schema created successfully!' AS message,
  COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
