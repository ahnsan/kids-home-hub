-- Kids Home Hub - Supabase Initial Schema
-- Migration 001: Core Tables and Schema
--
-- This migration creates all core tables for the Kids Home Hub application
-- integrated with Supabase Auth (auth.users)

-- =============================================================================
-- ENABLE EXTENSIONS
-- =============================================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS TABLE
-- =============================================================================

-- Application users table (references Supabase auth.users)
-- This table extends Supabase's built-in auth with app-specific user data
CREATE TABLE IF NOT EXISTS users (
  -- Use auth.users id as primary key (one-to-one relationship)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email (synced from auth.users)
  email TEXT UNIQUE NOT NULL,

  -- Email verification status
  email_verified BOOLEAN DEFAULT FALSE,

  -- User profile data
  display_name TEXT,
  avatar_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Comment for documentation
COMMENT ON TABLE users IS 'Application user profiles linked to Supabase auth.users';
COMMENT ON COLUMN users.id IS 'References auth.users(id) - Supabase Auth user ID';
COMMENT ON COLUMN users.email IS 'Synced from auth.users.email for convenience';

-- =============================================================================
-- CUSTOM AUTHENTICATION TABLES
-- =============================================================================

-- User sessions table (for multi-device tracking)
-- Note: Supabase Auth handles actual session tokens, this is for device tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Device information
  device_id TEXT,
  device_name TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'

  -- Session metadata
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON user_sessions(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON user_sessions(last_active_at DESC);

COMMENT ON TABLE user_sessions IS 'Multi-device session tracking (actual auth handled by Supabase Auth)';

-- =============================================================================
-- HOUSEHOLDS & MEMBERS
-- =============================================================================

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Household information
  name TEXT NOT NULL DEFAULT 'My Household',

  -- Creator/owner reference
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Optional household settings
  currency TEXT DEFAULT 'GBP', -- Default currency for money transactions
  timezone TEXT DEFAULT 'UTC',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for household lookups
CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);
CREATE INDEX IF NOT EXISTS idx_households_updated ON households(updated_at DESC);

COMMENT ON TABLE households IS 'Family households - primary organizational unit';
COMMENT ON COLUMN households.created_by IS 'Household creator (becomes default owner)';

-- Household members (for multi-parent/multi-user households)
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Role-based access control
  role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('owner', 'parent', 'viewer')),

  -- Invitation status
  invitation_status TEXT DEFAULT 'active' CHECK (invitation_status IN ('pending', 'active', 'inactive')),
  invited_by UUID REFERENCES users(id),

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one user can only be in a household once
  UNIQUE(household_id, user_id)
);

-- Indexes for household members
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_role ON household_members(household_id, role);

COMMENT ON TABLE household_members IS 'Multi-parent/guardian household membership';
COMMENT ON COLUMN household_members.role IS 'owner: full access, parent: manage children/chores, viewer: read-only';

-- =============================================================================
-- CHILDREN & CHORES
-- =============================================================================

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Household reference
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,

  -- Child information
  name TEXT NOT NULL,
  avatar TEXT, -- Emoji or image URL
  date_of_birth DATE, -- Optional for age-based features

  -- Balances (the three pillars of the app)
  money_total DECIMAL(10, 2) DEFAULT 0.00 CHECK (money_total >= 0),
  points_total INTEGER DEFAULT 0 CHECK (points_total >= 0),
  screen_total INTEGER DEFAULT 0 CHECK (screen_total >= 0), -- minutes

  -- Display settings
  display_order INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Future: child login credentials (optional feature)
  pin_hash TEXT, -- Hashed PIN for child login (future feature)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for children
CREATE INDEX IF NOT EXISTS idx_children_household ON children(household_id);
CREATE INDEX IF NOT EXISTS idx_children_household_active ON children(household_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_children_updated ON children(updated_at DESC);

COMMENT ON TABLE children IS 'Child profiles with money, points, and screen time balances';
COMMENT ON COLUMN children.money_total IS 'Total money balance (in household currency)';
COMMENT ON COLUMN children.points_total IS 'Total points earned from chores';
COMMENT ON COLUMN children.screen_total IS 'Total screen time earned (in minutes)';

-- Custom chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Household reference
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,

  -- Chore information
  label TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL CHECK (points >= 0),

  -- Display settings
  icon TEXT, -- Emoji icon
  category TEXT, -- 'cleaning', 'homework', 'pets', 'helping', etc.

  -- Chore type
  is_default BOOLEAN DEFAULT FALSE, -- TRUE for household default chores
  is_archived BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chores
CREATE INDEX IF NOT EXISTS idx_chores_household ON chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_household_active ON chores(household_id) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_chores_category ON chores(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chores_is_default ON chores(household_id, is_default);

COMMENT ON TABLE chores IS 'Household chores (both default and custom)';
COMMENT ON COLUMN chores.is_default IS 'TRUE for chores created via create_default_chores()';

-- =============================================================================
-- TRANSACTIONS & COMPLETIONS
-- =============================================================================

-- Transactions table (unified for money, points, screen time)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Child reference
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,

  -- Transaction type and action
  type TEXT NOT NULL CHECK (type IN ('money', 'points', 'screen_time')),
  action TEXT NOT NULL CHECK (action IN ('add', 'deduct', 'redeem', 'earn')),

  -- Amount (can be decimal for money, integer for points/screen_time)
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),

  -- Optional currency (for money transactions)
  currency TEXT, -- 'GBP', 'USD', 'EUR', etc.

  -- Reason/note
  reason TEXT,
  notes TEXT,

  -- Tracking
  created_by UUID REFERENCES users(id) NOT NULL,
  device_id TEXT, -- For multi-device sync tracking

  -- Metadata
  metadata JSONB, -- For future extensibility

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_child ON transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_child_type ON transactions(child_id, type, created_at DESC);

COMMENT ON TABLE transactions IS 'Unified transaction log for money, points, and screen time';
COMMENT ON COLUMN transactions.action IS 'add: manual add, deduct: manual deduct, earn: from chores, redeem: spend points';

-- Chore completions table
CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  chore_id UUID REFERENCES chores(id) ON DELETE SET NULL, -- Can be null if chore deleted

  -- Denormalized data (for historical record even if chore deleted)
  chore_label TEXT NOT NULL,
  points_earned INTEGER NOT NULL,

  -- Timing
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  week_start DATE NOT NULL, -- For weekly aggregation (Monday of the week)

  -- Tracking
  created_by UUID REFERENCES users(id) NOT NULL,

  -- Optional verification (future feature: child confirms completion)
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),

  -- Notes
  notes TEXT,

  -- Metadata
  metadata JSONB
);

-- Indexes for chore completions
CREATE INDEX IF NOT EXISTS idx_chore_completions_child ON chore_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_chore ON chore_completions(chore_id) WHERE chore_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chore_completions_week ON chore_completions(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_chore_completions_completed ON chore_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_chore_completions_child_week ON chore_completions(child_id, week_start DESC);

COMMENT ON TABLE chore_completions IS 'Historical record of completed chores';
COMMENT ON COLUMN chore_completions.week_start IS 'Monday of the week (for weekly aggregation)';
COMMENT ON COLUMN chore_completions.chore_label IS 'Denormalized - preserved even if chore deleted';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Display table count
SELECT
  'Initial schema created successfully!' AS message,
  COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
