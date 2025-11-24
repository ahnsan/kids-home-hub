-- Kids Home Hub - Row Level Security Policies
-- Migration 002: RLS Policies for Multi-Tenant Data Security
--
-- This migration implements comprehensive Row Level Security (RLS) policies
-- to ensure users can only access data from their own households.
--
-- Security Model:
-- 1. Users can only access households they own or are members of
-- 2. Household owners can manage all household data
-- 3. Parents can manage children and chores in their household
-- 4. Children data is scoped to household members only
-- 5. Transactions and chore completions follow household membership

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can view profiles of other household members
CREATE POLICY users_select_household_members
  ON users
  FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT user_id
      FROM household_members
      WHERE household_id IN (
        SELECT household_id
        FROM household_members
        WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON POLICY users_select_own ON users IS 'Users can view their own profile';
COMMENT ON POLICY users_update_own ON users IS 'Users can update their own profile';
COMMENT ON POLICY users_select_household_members ON users IS 'Users can view other members in their households';

-- =============================================================================
-- USER SESSIONS POLICIES
-- =============================================================================

-- Users can view their own sessions
CREATE POLICY sessions_select_own
  ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY sessions_insert_own
  ON user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY sessions_update_own
  ON user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY sessions_delete_own
  ON user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY sessions_select_own ON user_sessions IS 'Users can view their own device sessions';

-- =============================================================================
-- HOUSEHOLDS TABLE POLICIES
-- =============================================================================

-- Users can view households they own or are members of
CREATE POLICY households_select_member
  ON households
  FOR SELECT
  USING (
    -- User is the creator
    created_by = auth.uid()
    OR
    -- User is a member
    id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create new households (anyone authenticated)
CREATE POLICY households_insert_authenticated
  ON households
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Only household owners can update households
CREATE POLICY households_update_owner
  ON households
  FOR UPDATE
  USING (
    id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  )
  WITH CHECK (
    id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Only household owners can delete households
CREATE POLICY households_delete_owner
  ON households
  FOR DELETE
  USING (
    id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  );

COMMENT ON POLICY households_select_member ON households IS 'Users can view households they belong to';
COMMENT ON POLICY households_insert_authenticated ON households IS 'Any authenticated user can create a household';
COMMENT ON POLICY households_update_owner ON households IS 'Only owners can update household settings';
COMMENT ON POLICY households_delete_owner ON households IS 'Only owners can delete households';

-- =============================================================================
-- HOUSEHOLD MEMBERS TABLE POLICIES
-- =============================================================================

-- Users can view members of their households
CREATE POLICY household_members_select_same_household
  ON household_members
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Owners and parents can add new members
CREATE POLICY household_members_insert_owner_parent
  ON household_members
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  );

-- Owners can update member roles
CREATE POLICY household_members_update_owner
  ON household_members
  FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Owners can remove members OR users can remove themselves
CREATE POLICY household_members_delete_owner_or_self
  ON household_members
  FOR DELETE
  USING (
    -- User is household owner
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
    OR
    -- User is removing themselves
    user_id = auth.uid()
  );

COMMENT ON POLICY household_members_select_same_household ON household_members IS 'Members can view all members in their households';
COMMENT ON POLICY household_members_insert_owner_parent ON household_members IS 'Owners and parents can invite new members';
COMMENT ON POLICY household_members_update_owner ON household_members IS 'Only owners can change member roles';
COMMENT ON POLICY household_members_delete_owner_or_self ON household_members IS 'Owners can remove members, or users can leave';

-- =============================================================================
-- CHILDREN TABLE POLICIES
-- =============================================================================

-- Users can view children in their households
CREATE POLICY children_select_household_member
  ON children
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Owners and parents can add children
CREATE POLICY children_insert_owner_parent
  ON children
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  );

-- Owners and parents can update children
CREATE POLICY children_update_owner_parent
  ON children
  FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  );

-- Owners and parents can delete children
CREATE POLICY children_delete_owner_parent
  ON children
  FOR DELETE
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  );

COMMENT ON POLICY children_select_household_member ON children IS 'All household members can view children';
COMMENT ON POLICY children_insert_owner_parent ON children IS 'Owners and parents can add children';
COMMENT ON POLICY children_update_owner_parent ON children IS 'Owners and parents can update children';
COMMENT ON POLICY children_delete_owner_parent ON children IS 'Owners and parents can delete children';

-- =============================================================================
-- CHORES TABLE POLICIES
-- =============================================================================

-- Users can view chores in their households
CREATE POLICY chores_select_household_member
  ON chores
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Owners and parents can create chores
CREATE POLICY chores_insert_owner_parent
  ON chores
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  );

-- Owners and parents can update chores
CREATE POLICY chores_update_owner_parent
  ON chores
  FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  );

-- Owners and parents can delete chores
CREATE POLICY chores_delete_owner_parent
  ON chores
  FOR DELETE
  USING (
    household_id IN (
      SELECT household_id
      FROM household_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'parent')
    )
  );

COMMENT ON POLICY chores_select_household_member ON chores IS 'All household members can view chores';
COMMENT ON POLICY chores_insert_owner_parent ON chores IS 'Owners and parents can create chores';
COMMENT ON POLICY chores_update_owner_parent ON chores IS 'Owners and parents can update chores';
COMMENT ON POLICY chores_delete_owner_parent ON chores IS 'Owners and parents can delete chores';

-- =============================================================================
-- TRANSACTIONS TABLE POLICIES
-- =============================================================================

-- Users can view transactions for children in their households
CREATE POLICY transactions_select_household_member
  ON transactions
  FOR SELECT
  USING (
    child_id IN (
      SELECT id
      FROM children
      WHERE household_id IN (
        SELECT household_id
        FROM household_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Owners and parents can create transactions
CREATE POLICY transactions_insert_owner_parent
  ON transactions
  FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id
      FROM children
      WHERE household_id IN (
        SELECT household_id
        FROM household_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'parent')
      )
    )
    AND created_by = auth.uid()
  );

-- Users can update their own transactions (for corrections)
CREATE POLICY transactions_update_own
  ON transactions
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own recent transactions (within 24 hours)
CREATE POLICY transactions_delete_own_recent
  ON transactions
  FOR DELETE
  USING (
    created_by = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

COMMENT ON POLICY transactions_select_household_member ON transactions IS 'All household members can view transactions';
COMMENT ON POLICY transactions_insert_owner_parent ON transactions IS 'Owners and parents can create transactions';
COMMENT ON POLICY transactions_update_own ON transactions IS 'Users can update their own transactions';
COMMENT ON POLICY transactions_delete_own_recent ON transactions IS 'Users can delete their own recent transactions';

-- =============================================================================
-- CHORE COMPLETIONS TABLE POLICIES
-- =============================================================================

-- Users can view chore completions for children in their households
CREATE POLICY chore_completions_select_household_member
  ON chore_completions
  FOR SELECT
  USING (
    child_id IN (
      SELECT id
      FROM children
      WHERE household_id IN (
        SELECT household_id
        FROM household_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Owners and parents can record chore completions
CREATE POLICY chore_completions_insert_owner_parent
  ON chore_completions
  FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id
      FROM children
      WHERE household_id IN (
        SELECT household_id
        FROM household_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'parent')
      )
    )
    AND created_by = auth.uid()
  );

-- Users can update their own chore completions
CREATE POLICY chore_completions_update_own
  ON chore_completions
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own recent chore completions (within 24 hours)
CREATE POLICY chore_completions_delete_own_recent
  ON chore_completions
  FOR DELETE
  USING (
    created_by = auth.uid()
    AND completed_at > NOW() - INTERVAL '24 hours'
  );

COMMENT ON POLICY chore_completions_select_household_member ON chore_completions IS 'All household members can view completions';
COMMENT ON POLICY chore_completions_insert_owner_parent ON chore_completions IS 'Owners and parents can record completions';
COMMENT ON POLICY chore_completions_update_own ON chore_completions IS 'Users can update their own completions';
COMMENT ON POLICY chore_completions_delete_own_recent ON chore_completions IS 'Users can delete their own recent completions';

-- =============================================================================
-- POLICY VERIFICATION
-- =============================================================================

-- Display policy count
SELECT
  'RLS policies created successfully!' AS message,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public';

-- Display policies by table
SELECT
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
