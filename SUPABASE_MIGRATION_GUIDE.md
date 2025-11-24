# Kids Home Hub - Supabase Migration Guide

## Overview

This guide documents the complete Supabase database migration for the Kids Home Hub application. The migration includes schema creation, Row Level Security (RLS) policies, helper functions, auth integration triggers, and useful database views.

## Migration Files

All migration files are located in `/Users/Karim/kids-home-hub/supabase/migrations/`:

1. **001_initial_schema.sql** - Core tables and indexes
2. **002_rls_policies.sql** - Row Level Security policies
3. **003_helper_functions.sql** - Utility functions
4. **004_triggers.sql** - Auth integration triggers
5. **005_views.sql** - Database views for common queries

## Key Differences from Neon Schema

### Supabase Auth Integration

The Supabase migration integrates with Supabase's built-in authentication system (`auth.users`):

**Original (Neon):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  ...
);

CREATE TABLE magic_link_tokens (...);  -- Custom auth
CREATE TABLE user_sessions (...);      -- Custom sessions
```

**Supabase:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  ...
);

-- Triggers automatically create user records on signup
-- Supabase Auth handles sessions natively
-- user_sessions table repurposed for device tracking only
```

### Key Changes

1. **User ID**: Uses `auth.users(id)` as foreign key instead of generated UUID
2. **Email Sync**: Email synced from `auth.users.email` automatically
3. **Authentication**: No magic link tokens - uses Supabase Auth
4. **Sessions**: `user_sessions` table now only for device tracking, not auth
5. **Triggers**: Auto-create user records when users sign up via Supabase Auth

## Database Schema

### Core Tables

#### 1. users
Application user profiles linked to Supabase Auth.

```sql
- id (UUID, references auth.users)
- email (TEXT, synced from auth.users)
- email_verified (BOOLEAN)
- display_name (TEXT)
- avatar_url (TEXT)
- created_at, updated_at
```

#### 2. households
Family household organizational units.

```sql
- id (UUID)
- name (TEXT)
- created_by (UUID, references users)
- currency (TEXT, default 'GBP')
- timezone (TEXT, default 'UTC')
- created_at, updated_at
```

#### 3. household_members
Multi-parent/guardian household membership.

```sql
- id (UUID)
- household_id (UUID, references households)
- user_id (UUID, references users)
- role (TEXT: 'owner', 'parent', 'viewer')
- invitation_status (TEXT: 'pending', 'active', 'inactive')
- invited_by (UUID, references users)
- joined_at
```

#### 4. children
Child profiles with balances.

```sql
- id (UUID)
- household_id (UUID, references households)
- name (TEXT)
- avatar (TEXT, emoji or image URL)
- date_of_birth (DATE, optional)
- money_total (DECIMAL, >= 0)
- points_total (INTEGER, >= 0)
- screen_total (INTEGER, minutes, >= 0)
- display_order (INTEGER)
- is_archived (BOOLEAN)
- pin_hash (TEXT, for future child login)
- created_at, updated_at
```

#### 5. chores
Household chores (default and custom).

```sql
- id (UUID)
- household_id (UUID, references households)
- label (TEXT)
- description (TEXT)
- points (INTEGER, >= 0)
- icon (TEXT, emoji)
- category (TEXT: 'cleaning', 'homework', 'pets', 'helping', etc.)
- is_default (BOOLEAN)
- is_archived (BOOLEAN)
- created_at, updated_at
```

#### 6. transactions
Unified transaction log for money, points, and screen time.

```sql
- id (UUID)
- child_id (UUID, references children)
- type (TEXT: 'money', 'points', 'screen_time')
- action (TEXT: 'add', 'deduct', 'redeem', 'earn')
- amount (DECIMAL, > 0)
- currency (TEXT, for money transactions)
- reason (TEXT)
- notes (TEXT)
- created_by (UUID, references users)
- device_id (TEXT)
- metadata (JSONB)
- created_at
```

#### 7. chore_completions
Historical record of completed chores.

```sql
- id (UUID)
- child_id (UUID, references children)
- chore_id (UUID, references chores, nullable)
- chore_label (TEXT, denormalized)
- points_earned (INTEGER)
- completed_at
- week_start (DATE, Monday of the week)
- created_by (UUID, references users)
- verified_at, verified_by (future feature)
- notes (TEXT)
- metadata (JSONB)
```

## Row Level Security (RLS) Policies

All tables have RLS enabled with comprehensive policies:

### Security Model

1. **Users**: Can view/edit own profile + household members
2. **Households**: Can view if member, edit if owner
3. **Household Members**: Members see all members, owners manage roles
4. **Children**: All household members can view, owners/parents can edit
5. **Chores**: All household members can view, owners/parents can edit
6. **Transactions**: All household members can view, owners/parents can create
7. **Chore Completions**: All household members can view, owners/parents can create

### Key Policies

#### Household Access
```sql
-- View households you're a member of
CREATE POLICY households_select_member ON households
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Only owners can update/delete
CREATE POLICY households_update_owner ON households
  FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

#### Children Access
```sql
-- All household members can view children
CREATE POLICY children_select_household_member ON children
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Owners and parents can manage children
CREATE POLICY children_update_owner_parent ON children
  FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );
```

## Helper Functions

### User Management

#### get_or_create_user(user_id, user_email, is_verified)
Get or create user record (called by auth trigger).

```sql
SELECT get_or_create_user(
  'auth-user-id'::UUID,
  'user@example.com',
  TRUE
);
```

### Household Management

#### create_household(user_id, household_name, household_currency)
Create household with owner membership and default chores.

```sql
SELECT create_household(
  auth.uid(),
  'Smith Family',
  'GBP'
) AS new_household_id;
```

#### create_default_chores(household_uuid)
Create 5 default chores for a household.

```sql
SELECT create_default_chores('household-id'::UUID);
```

**Default Chores:**
- Tidy bedroom (10 points, 🛏️, cleaning)
- Finish homework (8 points, 📚, homework)
- Set / clear the table (5 points, 🍽️, helping)
- Feed pet / help pet (6 points, 🐕, pets)
- Help with laundry (7 points, 👕, helping)

#### add_household_member(household_uuid, new_user_id, member_role, inviter_user_id)
Add a member to a household with role validation.

```sql
SELECT add_household_member(
  'household-id'::UUID,
  'user-id'::UUID,
  'parent',
  auth.uid()
) AS new_member_id;
```

### Child Management

#### add_child(household_uuid, child_name, child_avatar, child_dob)
Add a child to a household with auto display ordering.

```sql
SELECT add_child(
  'household-id'::UUID,
  'Emma',
  '👧',
  '2015-03-15'::DATE
) AS new_child_id;
```

### Transaction Functions

#### complete_chore(child_id, chore_id, created_by, notes)
Atomically record chore completion and update balances.

```sql
SELECT complete_chore(
  'child-id'::UUID,
  'chore-id'::UUID,
  auth.uid(),
  'Great job!'
) AS completion_id;
```

This function:
1. Inserts chore completion record
2. Updates child's points balance
3. Records transaction
4. All atomic (succeeds or fails together)

#### adjust_money(child_id, amount, action, reason, created_by, currency)
Add or deduct money with balance validation.

```sql
SELECT adjust_money(
  'child-id'::UUID,
  5.00,
  'add',
  'Weekly allowance',
  auth.uid(),
  'GBP'
) AS transaction_id;
```

#### adjust_screen_time(child_id, minutes, action, reason, created_by)
Add or deduct screen time with balance validation.

```sql
SELECT adjust_screen_time(
  'child-id'::UUID,
  30,
  'add',
  'Completed homework',
  auth.uid()
) AS transaction_id;
```

### Analytics Functions

#### get_child_weekly_stats(child_id, weeks_back)
Get weekly activity stats for a child.

```sql
SELECT * FROM get_child_weekly_stats(
  'child-id'::UUID,
  4
);

-- Returns: week_start, chores_completed, points_earned, money_added, screen_time_added
```

#### get_household_leaderboard(household_id, time_period)
Get points leaderboard for a household.

```sql
SELECT * FROM get_household_leaderboard(
  'household-id'::UUID,
  'week'  -- or 'month', 'all_time'
);

-- Returns: child_id, child_name, child_avatar, points_earned, chores_completed (ranked)
```

### Cleanup Functions

#### cleanup_old_sessions(days_to_keep)
Delete inactive sessions older than specified days.

```sql
SELECT cleanup_old_sessions(30);
-- Returns: number of sessions deleted
```

## Auth Integration Triggers

### on_auth_user_created
Automatically creates app user record when user signs up via Supabase Auth.

```sql
-- Triggered on: INSERT INTO auth.users
-- Action: INSERT INTO public.users
-- Syncs: id, email, email_verified, display_name, avatar_url
```

### on_auth_user_updated
Syncs changes from auth.users to public.users.

```sql
-- Triggered on: UPDATE auth.users
-- When: email, email_confirmed_at, or raw_user_meta_data changes
-- Action: UPDATE public.users
```

### on_auth_user_deleted
Logs user deletion (cascade deletes user record automatically).

```sql
-- Triggered on: DELETE FROM auth.users
-- Action: LOG deletion, cleanup operations
```

### on_household_created
Auto-adds creator as owner and creates default chores.

```sql
-- Triggered on: INSERT INTO households
-- Action:
--   1. INSERT INTO household_members (role = 'owner')
--   2. Call create_default_chores()
```

### check_last_owner_delete / check_last_owner_update
Prevents removing the last owner from a household.

```sql
-- Triggered on: DELETE/UPDATE household_members
-- When: Trying to remove/change last owner
-- Action: RAISE EXCEPTION
```

### validate_balances_insert / validate_balances_update
Ensures child balances never go negative.

```sql
-- Triggered on: INSERT/UPDATE children
-- When: money_total, points_total, or screen_total changes
-- Action: Validate >= 0, raise exception if negative
```

### set_chore_week_start
Auto-calculates week_start (Monday) for chore completions.

```sql
-- Triggered on: INSERT/UPDATE chore_completions
-- Action: SET week_start = DATE_TRUNC('week', completed_at)::DATE
```

## Database Views

### household_summary
Overview of household with member and activity counts.

```sql
SELECT * FROM household_summary WHERE household_id = 'id';
```

### child_balances
Child dashboard with balances and weekly/monthly activity.

```sql
SELECT * FROM child_balances WHERE household_id = 'id';
```

### household_members_detailed
Household members with full user details.

```sql
SELECT * FROM household_members_detailed WHERE household_id = 'id';
```

### recent_transactions
Transactions with child and user details.

```sql
SELECT * FROM recent_transactions WHERE household_id = 'id' LIMIT 20;
```

### recent_chore_completions
Chore completions with child and chore details.

```sql
SELECT * FROM recent_chore_completions WHERE household_id = 'id' LIMIT 20;
```

### weekly_leaderboard / monthly_leaderboard
Points leaderboard by household (weekly or monthly).

```sql
SELECT * FROM weekly_leaderboard WHERE household_id = 'id';
SELECT * FROM monthly_leaderboard WHERE household_id = 'id';
```

### chore_popularity
Chore completion statistics by household.

```sql
SELECT * FROM chore_popularity WHERE household_id = 'id';
```

### user_households
All households a user belongs to with stats.

```sql
SELECT * FROM user_households WHERE user_id = auth.uid();
```

### transaction_summary
Transaction totals and counts by child.

```sql
SELECT * FROM transaction_summary WHERE household_id = 'id';
```

## Migration Steps

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Note down your project URL and anon key

### 2. Run Migrations

Option A: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Option B: Using Supabase Dashboard

1. Go to SQL Editor in your Supabase dashboard
2. Run each migration file in order:
   - 001_initial_schema.sql
   - 002_rls_policies.sql
   - 003_helper_functions.sql
   - 004_triggers.sql
   - 005_views.sql

### 3. Verify Migration

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check views
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
```

## Application Integration

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Initialize Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Environment Variables

Add to `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Authentication Flow

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
// User record automatically created via trigger!

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()
```

### 5. Data Access (with RLS)

```typescript
// RLS automatically enforces access control!

// Get user's households
const { data: households } = await supabase
  .from('user_households')
  .select('*')
  .order('joined_at', { ascending: false })

// Get children in household
const { data: children } = await supabase
  .from('child_balances')
  .select('*')
  .eq('household_id', householdId)
  .order('display_order')

// Complete a chore (using RPC for function call)
const { data, error } = await supabase.rpc('complete_chore', {
  completion_child_id: childId,
  completion_chore_id: choreId,
  completion_created_by: user.id,
  completion_notes: 'Great job!'
})
```

## Sample Queries

### Create Household and Add Child

```typescript
// Create household (function handles owner setup and default chores)
const { data: householdId } = await supabase.rpc('create_household', {
  user_id: user.id,
  household_name: 'Smith Family',
  household_currency: 'GBP'
})

// Add a child
const { data: childId } = await supabase.rpc('add_child', {
  household_uuid: householdId,
  child_name: 'Emma',
  child_avatar: '👧',
  child_dob: '2015-03-15'
})
```

### Complete Chore

```typescript
// Complete chore (atomically updates points and records transaction)
const { data, error } = await supabase.rpc('complete_chore', {
  completion_child_id: childId,
  completion_chore_id: choreId,
  completion_created_by: user.id,
  completion_notes: 'Cleaned room thoroughly!'
})
```

### Adjust Money

```typescript
// Add money
await supabase.rpc('adjust_money', {
  transaction_child_id: childId,
  transaction_amount: 5.00,
  transaction_action: 'add',
  transaction_reason: 'Weekly allowance',
  transaction_created_by: user.id,
  transaction_currency: 'GBP'
})

// Deduct money (validates sufficient balance)
await supabase.rpc('adjust_money', {
  transaction_child_id: childId,
  transaction_amount: 2.50,
  transaction_action: 'deduct',
  transaction_reason: 'Bought toy',
  transaction_created_by: user.id,
  transaction_currency: 'GBP'
})
```

### Get Weekly Stats

```typescript
const { data: stats } = await supabase.rpc('get_child_weekly_stats', {
  stats_child_id: childId,
  weeks_back: 4
})
```

### Get Leaderboard

```typescript
const { data: leaderboard } = await supabase.rpc('get_household_leaderboard', {
  leaderboard_household_id: householdId,
  time_period: 'week'  // or 'month', 'all_time'
})
```

## Security Best Practices

### 1. RLS Policies
- All tables have RLS enabled
- Users can only access their household's data
- Policies use `auth.uid()` for current user checks

### 2. Function Security
- Functions use `SECURITY DEFINER` where needed
- Balance validations prevent negative values
- Atomic operations ensure data consistency

### 3. Triggers
- Auth triggers are `SECURITY DEFINER`
- Last owner protection prevents orphaned households
- Balance validation ensures data integrity

### 4. Client-Side
- Never expose service role key
- Use anon key in client applications
- Let RLS handle authorization

## Testing

### Test User Creation

```sql
-- Sign up via Supabase Auth creates record automatically
-- Or manually test trigger:
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
VALUES (
  uuid_generate_v4(),
  'test@example.com',
  NOW(),
  '{"display_name": "Test User"}'::JSONB
);

-- Check user was created
SELECT * FROM users WHERE email = 'test@example.com';
```

### Test Household Creation

```sql
-- Using helper function
SELECT create_household(
  (SELECT id FROM users WHERE email = 'test@example.com'),
  'Test Family',
  'GBP'
) AS household_id;

-- Verify household, membership, and default chores
SELECT * FROM household_summary WHERE owner_email = 'test@example.com';
SELECT * FROM household_members WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
SELECT * FROM chores WHERE household_id IN (SELECT id FROM households WHERE created_by = (SELECT id FROM users WHERE email = 'test@example.com'));
```

### Test Chore Completion

```sql
-- Add a child first
SELECT add_child(
  (SELECT id FROM households WHERE created_by = (SELECT id FROM users WHERE email = 'test@example.com')),
  'Emma',
  '👧',
  '2015-03-15'::DATE
) AS child_id;

-- Complete a chore
SELECT complete_chore(
  (SELECT id FROM children WHERE name = 'Emma'),
  (SELECT id FROM chores WHERE label = 'Tidy bedroom' LIMIT 1),
  (SELECT id FROM users WHERE email = 'test@example.com'),
  'Great job!'
) AS completion_id;

-- Check balances updated
SELECT * FROM child_balances WHERE name = 'Emma';

-- Check transaction recorded
SELECT * FROM recent_transactions WHERE child_name = 'Emma';
```

## Troubleshooting

### RLS Blocking Access

If queries return no results, check:
1. User is authenticated (`auth.uid()` returns user ID)
2. User is a household member
3. RLS policies are enabled

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies for a table
SELECT * FROM pg_policies WHERE tablename = 'children';
```

### Trigger Not Firing

Check trigger exists and is enabled:

```sql
SELECT tgname, tgenabled, tgrelid::regclass
FROM pg_trigger
WHERE tgname LIKE 'on_%';
```

### Function Errors

Check function exists:

```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'complete_chore';
```

## Maintenance

### Regular Cleanup

```sql
-- Run weekly to clean up old sessions
SELECT cleanup_old_sessions(30);
```

### Monitoring

```sql
-- Check active users
SELECT COUNT(*) FROM users WHERE email_verified = TRUE;

-- Check household stats
SELECT
  COUNT(*) AS total_households,
  AVG(member_count) AS avg_members,
  AVG(active_children_count) AS avg_children
FROM household_summary;

-- Check activity
SELECT
  COUNT(*) AS total_completions,
  SUM(points_earned) AS total_points
FROM chore_completions
WHERE completed_at >= NOW() - INTERVAL '7 days';
```

## Migration Checklist

- [ ] Create Supabase project
- [ ] Run migration 001 (initial schema)
- [ ] Run migration 002 (RLS policies)
- [ ] Run migration 003 (helper functions)
- [ ] Run migration 004 (triggers)
- [ ] Run migration 005 (views)
- [ ] Verify all tables created
- [ ] Verify all policies created
- [ ] Verify all functions created
- [ ] Verify all triggers created
- [ ] Verify all views created
- [ ] Test auth user creation
- [ ] Test household creation
- [ ] Test child creation
- [ ] Test chore completion
- [ ] Test RLS policies
- [ ] Update application environment variables
- [ ] Replace Neon client with Supabase client
- [ ] Test application authentication
- [ ] Test application data access
- [ ] Deploy to production

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- PostgreSQL Docs: https://www.postgresql.org/docs/
