-- =============================================
-- Kids Home Hub - RLS Policies
-- Row Level Security policies for multi-tenant data
-- Migration: 20251124000001
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER PROFILES POLICIES
-- =============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- HOUSEHOLDS POLICIES
-- =============================================

-- Users can read households they own or are members of
CREATE POLICY "Users can read own households"
  ON households FOR SELECT
  USING (
    auth.uid() = created_by OR
    id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Users can create households
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only household owners can update
CREATE POLICY "Owners can update households"
  ON households FOR UPDATE
  USING (auth.uid() = created_by);

-- Only household owners can delete
CREATE POLICY "Owners can delete households"
  ON households FOR DELETE
  USING (auth.uid() = created_by);

-- =============================================
-- HOUSEHOLD MEMBERS POLICIES
-- =============================================

-- Users can read members of households they belong to
CREATE POLICY "Users can read household members"
  ON household_members FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Owners can add members
CREATE POLICY "Owners can add members"
  ON household_members FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- Owners can remove members
CREATE POLICY "Owners can remove members"
  ON household_members FOR DELETE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- =============================================
-- CHILDREN POLICIES
-- =============================================

-- Users can read children in their households
CREATE POLICY "Users can read children"
  ON children FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Owners and parents can create children
CREATE POLICY "Owners/parents can create children"
  ON children FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- Owners and parents can update children
CREATE POLICY "Owners/parents can update children"
  ON children FOR UPDATE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- Owners and parents can delete children
CREATE POLICY "Owners/parents can delete children"
  ON children FOR DELETE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- =============================================
-- CHORES POLICIES
-- =============================================

-- Users can read chores in their households
CREATE POLICY "Users can read chores"
  ON chores FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Owners/parents can create chores
CREATE POLICY "Owners/parents can create chores"
  ON chores FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- Owners/parents can update chores
CREATE POLICY "Owners/parents can update chores"
  ON chores FOR UPDATE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- Owners/parents can delete custom chores (not default)
CREATE POLICY "Owners/parents can delete custom chores"
  ON chores FOR DELETE
  USING (
    is_default = FALSE AND
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- =============================================
-- TRANSACTIONS POLICIES
-- =============================================

-- Users can read transactions for children in their households
CREATE POLICY "Users can read transactions"
  ON transactions FOR SELECT
  USING (
    child_id IN (
      SELECT c.id FROM children c
      WHERE c.household_id IN (
        SELECT id FROM households WHERE created_by = auth.uid()
        UNION
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Owners/parents can create transactions
CREATE POLICY "Owners/parents can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      WHERE c.household_id IN (
        SELECT id FROM households WHERE created_by = auth.uid()
        UNION
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
      )
    )
  );

-- =============================================
-- CHORE COMPLETIONS POLICIES
-- =============================================

-- Users can read completions for children in their households
CREATE POLICY "Users can read chore completions"
  ON chore_completions FOR SELECT
  USING (
    child_id IN (
      SELECT c.id FROM children c
      WHERE c.household_id IN (
        SELECT id FROM households WHERE created_by = auth.uid()
        UNION
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Owners/parents can create completions
CREATE POLICY "Owners/parents can create chore completions"
  ON chore_completions FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      WHERE c.household_id IN (
        SELECT id FROM households WHERE created_by = auth.uid()
        UNION
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
      )
    )
  );
