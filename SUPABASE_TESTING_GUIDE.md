# Supabase Migration - Testing Guide

**For**: Kids Home Hub Supabase Migration
**Date**: 2025-11-24
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Testing Phases](#testing-phases)
4. [Manual Testing Checklist](#manual-testing-checklist)
5. [Automated Testing](#automated-testing)
6. [RLS Policy Verification](#rls-policy-verification)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Troubleshooting](#troubleshooting)
10. [Success Criteria](#success-criteria)

---

## Overview

This guide provides step-by-step testing procedures to verify the Supabase migration is working correctly. All features should be tested in the following order:

1. Database setup and connectivity
2. Authentication flow
3. CRUD operations
4. RLS policy enforcement
5. Business logic and triggers
6. Performance and security

**Estimated Testing Time**: 2-3 hours

---

## Prerequisites

### Before You Start

- [ ] Supabase migrations have been run successfully
- [ ] Environment variables are configured in `/apps/pwa/.env.local`
- [ ] PWA development server is running (`pnpm dev`)
- [ ] Supabase dashboard is open in browser
- [ ] Browser console is open (F12) to watch for errors

### Required Tools

- Web browser (Chrome/Firefox recommended)
- Supabase dashboard access
- Terminal for SQL queries
- Postman/Insomnia (optional, for API testing)

### Environment Check

```bash
# Verify environment variables
cd /Users/Karim/kids-home-hub/apps/pwa
cat .env.local

# Should contain:
# VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Start development server
pnpm dev

# Open browser to http://localhost:3000
```

---

## Testing Phases

### Phase 1: Database Connectivity (15 minutes)

#### 1.1 Verify Migration Success

Open Supabase Dashboard SQL Editor and run:

```sql
-- Check all tables exist (should return 8)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- children, chore_completions, chores, household_members,
-- households, transactions, user_sessions, users
```

**Expected Result**: 8 rows returned with all table names

#### 1.2 Verify RLS Policies

```sql
-- Check RLS policies (should return 30+)
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Result**: 30+ policies covering SELECT, INSERT, UPDATE, DELETE

#### 1.3 Verify Helper Functions

```sql
-- Check helper functions exist (should return 11+)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected functions:
-- add_child, add_household_member, adjust_money, adjust_screen_time,
-- complete_chore, create_default_chores, create_household,
-- get_child_weekly_stats, get_household_leaderboard,
-- get_or_create_user, cleanup_old_sessions
```

**Expected Result**: 11+ functions listed

#### 1.4 Verify Triggers

```sql
-- Check triggers (should return 9+)
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Expected Result**: 9+ triggers listed

#### 1.5 Verify Views

```sql
-- Check views (should return 10)
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected views:
-- child_balances, chore_popularity, household_members_detailed,
-- household_summary, monthly_leaderboard, recent_chore_completions,
-- recent_transactions, transaction_summary, user_households,
-- weekly_leaderboard
```

**Expected Result**: 10 views listed

**Success Criteria**: All counts match expected values, no errors

---

### Phase 2: Authentication Testing (30 minutes)

#### 2.1 Test Magic Link Sign In

**Steps**:

1. Open http://localhost:3000
2. Enter email address (use a real email you can access)
3. Click "Send Magic Link"
4. Check email for magic link
5. Click magic link in email
6. Verify you are redirected back to app
7. Verify you are signed in

**Expected Results**:

- Magic link email received within 1-2 minutes
- Clicking link redirects to app with `#access_token=...` in URL
- User session is created
- User is authenticated
- No console errors

**Verify in Supabase Dashboard**:

```sql
-- Check user was created in auth.users
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Check user record was auto-created in public.users
SELECT id, email, display_name, created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 1;

-- Verify trigger created both records
-- IDs should match between auth.users and public.users
```

#### 2.2 Test Session Persistence

**Steps**:

1. Sign in using magic link
2. Verify you are authenticated
3. Refresh the browser (F5)
4. Verify you are still signed in
5. Open app in new tab
6. Verify you are signed in in both tabs

**Expected Results**:

- Session persists across page refreshes
- Session is shared across browser tabs
- No re-authentication required

#### 2.3 Test Sign Out

**Steps**:

1. Sign in using magic link
2. Click "Sign Out" button
3. Verify you are signed out
4. Verify you are redirected to login page
5. Refresh the page
6. Verify you remain signed out

**Expected Results**:

- Session is cleared
- User is redirected to login
- No console errors

**Verify in Console**:

```javascript
// Check session is cleared
const session = await supabase.auth.getSession();
console.log(session); // Should be null
```

#### 2.4 Test Invalid/Expired Links

**Steps**:

1. Request magic link
2. Wait for link to arrive
3. Modify the `access_token` in URL (change one character)
4. Try to access the modified URL

**Expected Results**:

- Error message displayed
- User is not authenticated
- Redirected to login page

#### 2.5 Test Concurrent Sessions

**Steps**:

1. Sign in on Chrome
2. Sign in on Firefox with same email
3. Verify both sessions work independently
4. Sign out in Chrome
5. Verify Firefox session remains active

**Expected Results**:

- Multiple sessions supported per user
- Independent session management
- Signing out in one browser doesn't affect others

**Success Criteria**: All authentication flows work without errors

---

### Phase 3: CRUD Operations Testing (60 minutes)

#### 3.1 Test Household Creation

**Steps**:

1. Sign in to the app
2. Create a new household:
   - Name: "Test Family"
   - Currency: "GBP"
3. Verify household is created
4. Verify you see the household dashboard

**Expected Results**:

- Household created successfully
- User is added as owner automatically
- Default chores are created automatically (5 chores)
- No console errors

**Verify in Supabase Dashboard**:

```sql
-- Get the authenticated user ID
SELECT auth.uid();

-- Check household was created
SELECT id, name, currency, created_at
FROM households
WHERE created_by = auth.uid()
ORDER BY created_at DESC
LIMIT 1;

-- Check user is owner
SELECT hm.role, h.name
FROM household_members hm
JOIN households h ON h.id = hm.household_id
WHERE hm.user_id = auth.uid()
  AND hm.role = 'owner';

-- Check default chores were created
SELECT id, title, points
FROM chores
WHERE household_id = (
  SELECT id FROM households
  WHERE created_by = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
);
-- Should return 5 default chores
```

#### 3.2 Test Child Creation

**Steps**:

1. Open household dashboard
2. Add a new child:
   - Name: "Emma"
   - Date of Birth: "2015-03-15"
   - Avatar: "👧"
3. Verify child appears in list
4. Verify child has zero balances (money, points, screen time)

**Expected Results**:

- Child created successfully
- Initial balances are all zero
- Display order is set correctly
- Child appears in UI immediately

**Verify in Database**:

```sql
-- Check child was created
SELECT id, name, avatar, date_of_birth,
       money_balance, points_balance, screen_time_balance
FROM children
WHERE household_id = (
  SELECT id FROM households
  WHERE created_by = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
)
ORDER BY created_at DESC
LIMIT 1;

-- Verify balances are zero
-- money_balance should be 0.00
-- points_balance should be 0
-- screen_time_balance should be 0
```

#### 3.3 Test Multiple Children

**Steps**:

1. Add second child (Name: "Oliver", Avatar: "👦")
2. Add third child (Name: "Sophia", Avatar: "👧")
3. Verify all three children appear in correct order
4. Verify display_order is sequential (1, 2, 3)

**Expected Results**:

- All children created successfully
- Display order is automatic and correct
- No duplicate orders

**Verify in Database**:

```sql
-- Check all children with their display order
SELECT name, display_order, created_at
FROM children
WHERE household_id = (
  SELECT id FROM households
  WHERE created_by = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
)
ORDER BY display_order;

-- Should return 3 children with display_order 1, 2, 3
```

#### 3.4 Test Child Update

**Steps**:

1. Click on a child to edit
2. Change name from "Emma" to "Emily"
3. Change avatar from "👧" to "🎀"
4. Save changes
5. Verify changes are reflected immediately

**Expected Results**:

- Update saves successfully
- UI updates immediately
- No console errors

**Verify in Database**:

```sql
-- Check child was updated
SELECT name, avatar, updated_at
FROM children
WHERE name = 'Emily'
  AND household_id = (
    SELECT id FROM households
    WHERE created_by = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1
  );
```

#### 3.5 Test Child Deletion

**Steps**:

1. Create a test child (Name: "Test Child")
2. Delete the test child
3. Verify child is removed from UI
4. Verify child is soft-deleted (archived) in database

**Expected Results**:

- Child removed from UI
- Data is preserved (soft delete)
- Related records remain intact

**Verify in Database**:

```sql
-- Check child was soft-deleted
SELECT name, deleted_at, deleted_by
FROM children
WHERE name = 'Test Child'
  AND deleted_at IS NOT NULL;

-- deleted_at should be set
-- deleted_by should be your user ID
```

#### 3.6 Test Chore Creation

**Steps**:

1. Open chores management page
2. Create a custom chore:
   - Title: "Clean Bedroom"
   - Points: 10
   - Frequency: "Weekly"
3. Verify chore appears in list
4. Verify chore is available for all children

**Expected Results**:

- Chore created successfully
- Appears in chores list
- Points value is correct

**Verify in Database**:

```sql
-- Check custom chore was created
SELECT id, title, points, frequency, is_default
FROM chores
WHERE title = 'Clean Bedroom'
  AND household_id = (
    SELECT id FROM households
    WHERE created_by = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1
  );

-- is_default should be false
```

#### 3.7 Test Chore Completion

**Steps**:

1. Select a child
2. Complete a chore (e.g., "Make Bed")
3. Verify:
   - Chore completion is recorded
   - Child's points increase by chore points
   - Transaction is created
4. Check chore completion history

**Expected Results**:

- Chore completion recorded
- Points balance updated atomically
- Transaction created with correct amounts
- UI updates immediately

**Verify in Database**:

```sql
-- Check chore completion was recorded
SELECT cc.id, c.title, ch.name as child_name,
       cc.points_earned, cc.created_at
FROM chore_completions cc
JOIN chores c ON c.id = cc.chore_id
JOIN children ch ON ch.id = cc.child_id
ORDER BY cc.created_at DESC
LIMIT 1;

-- Check points were added
SELECT name, points_balance
FROM children
WHERE id = (
  SELECT child_id FROM chore_completions
  ORDER BY created_at DESC
  LIMIT 1
);

-- Check transaction was created
SELECT id, transaction_type, amount, description
FROM transactions
WHERE transaction_type = 'points_earned'
ORDER BY created_at DESC
LIMIT 1;
```

#### 3.8 Test Money Transactions

**Steps**:

1. Add money to a child:
   - Amount: 5.00
   - Description: "Pocket money"
2. Verify money balance increases
3. Deduct money:
   - Amount: 2.50
   - Description: "Saved for later"
4. Verify money balance decreases

**Expected Results**:

- Money added successfully
- Money deducted successfully
- Balances are accurate (5.00 - 2.50 = 2.50)
- Cannot go negative (validation works)

**Verify in Database**:

```sql
-- Check money transactions
SELECT child_id, transaction_type, amount, description, created_at
FROM transactions
WHERE transaction_type IN ('money_added', 'money_deducted')
ORDER BY created_at DESC
LIMIT 2;

-- Check final balance
SELECT name, money_balance
FROM children
WHERE id = (
  SELECT child_id FROM transactions
  WHERE transaction_type = 'money_added'
  ORDER BY created_at DESC
  LIMIT 1
);
-- Should be 2.50
```

#### 3.9 Test Points to Screen Time Conversion

**Steps**:

1. Give a child 60 points (complete 6x 10-point chores)
2. Convert 30 points to screen time
3. Verify:
   - Points decrease by 30
   - Screen time increases by 30 minutes
   - Transaction recorded

**Expected Results**:

- Points deducted: 30
- Screen time added: 30 minutes
- Balance validation works
- Transaction recorded correctly

**Verify in Database**:

```sql
-- Check the conversion transaction
SELECT child_id, transaction_type, amount, description
FROM transactions
WHERE transaction_type = 'points_redeemed'
ORDER BY created_at DESC
LIMIT 1;

-- Check balances
SELECT name, points_balance, screen_time_balance
FROM children
WHERE id = (
  SELECT child_id FROM transactions
  WHERE transaction_type = 'points_redeemed'
  ORDER BY created_at DESC
  LIMIT 1
);
```

#### 3.10 Test Screen Time Usage

**Steps**:

1. Add 60 minutes of screen time to a child
2. Deduct 15 minutes (e.g., watched 15 minutes of TV)
3. Verify screen time balance decreases
4. Try to deduct more than available
5. Verify error is shown

**Expected Results**:

- Screen time deducted successfully
- Cannot go negative (validation error)
- Transaction recorded

**Verify in Database**:

```sql
-- Check screen time transactions
SELECT child_id, transaction_type, amount, description
FROM transactions
WHERE child_id = (SELECT id FROM children WHERE name = 'Emma')
  AND transaction_type LIKE 'screen_time%'
ORDER BY created_at DESC
LIMIT 2;
```

**Success Criteria**: All CRUD operations work correctly, data integrity maintained

---

### Phase 4: RLS Policy Verification (45 minutes)

#### 4.1 Test Household Isolation

**Purpose**: Verify users can only access their own household data

**Steps**:

1. Sign in as User A
2. Create Household A
3. Add Child A to Household A
4. Note the child ID from database
5. Sign out
6. Sign in as User B
7. Create Household B
8. Try to access Child A's data using Supabase client

**Verify in Console**:

```javascript
// As User B, try to query User A's child
const { data, error } = await supabase
  .from('children')
  .select('*')
  .eq('id', '<child-a-id>');

console.log(data); // Should be empty array []
console.log(error); // Should be null (query succeeds but returns no data)
```

**Expected Results**:

- Query returns empty array (not an error)
- RLS silently filters out unauthorized data
- No access to other household's data

#### 4.2 Test Role-Based Permissions

**Purpose**: Verify owner, parent, and viewer roles work correctly

**Setup**:

```sql
-- As owner, add a parent to your household
SELECT add_household_member(
  '<household-id>',
  '<parent-user-id>',
  'parent'
);

-- Add a viewer
SELECT add_household_member(
  '<household-id>',
  '<viewer-user-id>',
  'viewer'
);
```

**Test Owner Permissions**:

```javascript
// Sign in as owner
// Should be able to:
// - Create/read/update/delete children ✓
// - Create/read/update/delete chores ✓
// - Create transactions ✓
// - Manage household members ✓
// - Delete household ✓
```

**Test Parent Permissions**:

```javascript
// Sign in as parent
// Should be able to:
// - Read all household data ✓
// - Create/update children ✓
// - Create/update chores ✓
// - Create transactions ✓
// - Cannot manage household members ✗
// - Cannot delete household ✗
```

**Test Viewer Permissions**:

```javascript
// Sign in as viewer
// Should be able to:
// - Read all household data ✓
// - Cannot create/update anything ✗
// - Cannot manage members ✗
// - Cannot delete household ✗
```

**Verify in Database**:

```sql
-- Check RLS policies for children table
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'children'
ORDER BY policyname;

-- Test as different roles
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO '<user-id>';

-- Try operations as viewer (should fail)
INSERT INTO children (household_id, name, avatar)
VALUES ('<household-id>', 'Test', '👶');
-- ERROR: new row violates row-level security policy
```

#### 4.3 Test User Session RLS

**Purpose**: Verify users can only access their own sessions

**Steps**:

1. Sign in as User A
2. Query user_sessions table
3. Verify you only see your own sessions
4. Try to query another user's sessions

**Verify in Console**:

```javascript
// Should only return your sessions
const { data } = await supabase
  .from('user_sessions')
  .select('*');

console.log(data); // Only your sessions

// Try to query specific session from another user
const { data: otherSession } = await supabase
  .from('user_sessions')
  .select('*')
  .eq('id', '<other-user-session-id>');

console.log(otherSession); // Empty array
```

**Expected Results**:

- Only your own sessions returned
- No access to other users' sessions

#### 4.4 Test Transaction RLS

**Purpose**: Verify users can only see transactions for their household children

**Steps**:

1. Create transactions for your children
2. Query transactions table
3. Verify you only see transactions for your household
4. Sign in as another user
5. Verify you cannot see first user's transactions

**Verify in Database**:

```sql
-- As User A
SELECT t.id, c.name, t.amount, t.transaction_type
FROM transactions t
JOIN children c ON c.id = t.child_id
WHERE t.created_by = auth.uid();

-- As User B (should be empty if no transactions)
SELECT t.id, c.name, t.amount
FROM transactions t
JOIN children c ON c.id = t.child_id
WHERE t.created_by = auth.uid();
```

**Success Criteria**: All RLS policies enforce correct access control

---

### Phase 5: Business Logic & Triggers (30 minutes)

#### 5.1 Test Auto-Create User Trigger

**Steps**:

1. Create a new user via Supabase Auth
2. Verify user record is auto-created in public.users table

**Verify in Database**:

```sql
-- Check auth.users has new user
SELECT id, email, created_at
FROM auth.users
WHERE email = 'newuser@example.com';

-- Check public.users has matching record
SELECT id, email, created_at
FROM public.users
WHERE email = 'newuser@example.com';

-- IDs should match
```

#### 5.2 Test Auto-Create Default Chores Trigger

**Steps**:

1. Create a new household
2. Verify 5 default chores are created automatically

**Verify in Database**:

```sql
-- Check default chores were created
SELECT title, points, is_default
FROM chores
WHERE household_id = '<new-household-id>'
  AND is_default = true;

-- Should return 5 chores:
-- Make Bed (5 points)
-- Tidy Room (10 points)
-- Help with Dishes (10 points)
-- Homework (15 points)
-- Help Parent (20 points)
```

#### 5.3 Test Balance Validation Trigger

**Steps**:

1. Try to manually set a child's money_balance to negative
2. Verify the operation fails

**Test in Database**:

```sql
-- This should fail
UPDATE children
SET money_balance = -10.00
WHERE id = '<child-id>';

-- ERROR: Check constraint violated: money_balance_non_negative
```

#### 5.4 Test Last Owner Protection Trigger

**Steps**:

1. Create a household as owner
2. Try to change your role from owner to parent
3. Verify the operation fails (you are the last owner)
4. Add another owner
5. Now change your role to parent
6. Verify it succeeds

**Test in Database**:

```sql
-- Try to change last owner's role (should fail)
UPDATE household_members
SET role = 'parent'
WHERE household_id = '<household-id>'
  AND user_id = auth.uid()
  AND role = 'owner';

-- ERROR: Cannot change last owner's role

-- Add another owner
SELECT add_household_member(
  '<household-id>',
  '<another-user-id>',
  'owner'
);

-- Now you can change your role
UPDATE household_members
SET role = 'parent'
WHERE household_id = '<household-id>'
  AND user_id = auth.uid();
-- Should succeed
```

#### 5.5 Test Week Start Calculation Trigger

**Steps**:

1. Create a new chore completion
2. Verify week_start is automatically calculated

**Verify in Database**:

```sql
-- Check week_start is set correctly
SELECT id, created_at, week_start
FROM chore_completions
ORDER BY created_at DESC
LIMIT 1;

-- week_start should be the Monday of the week containing created_at
```

**Success Criteria**: All triggers fire correctly and enforce business rules

---

### Phase 6: Performance Testing (20 minutes)

#### 6.1 Test Query Performance

**Steps**:

1. Create test data:
   - 1 household
   - 5 children
   - 100 transactions per child (500 total)
   - 50 chore completions per child (250 total)

2. Run performance queries:

```sql
-- Query with view (should be fast)
EXPLAIN ANALYZE
SELECT * FROM child_balances
WHERE household_id = '<household-id>';

-- Complex aggregation query
EXPLAIN ANALYZE
SELECT
  c.name,
  COUNT(cc.id) as total_completions,
  SUM(cc.points_earned) as total_points
FROM children c
LEFT JOIN chore_completions cc ON cc.child_id = c.id
WHERE c.household_id = '<household-id>'
GROUP BY c.id, c.name;

-- Recent transactions (should use index)
EXPLAIN ANALYZE
SELECT * FROM recent_transactions
WHERE household_id = '<household-id>'
LIMIT 20;
```

**Expected Results**:

- All queries return in < 100ms
- Indexes are being used
- No sequential scans on large tables

#### 6.2 Test Realtime Performance

**Steps**:

1. Open app in two browser tabs
2. Make a change in tab 1 (e.g., complete a chore)
3. Refresh tab 2
4. Verify change appears in tab 2 within 1 second

**Expected Results**:

- Changes propagate quickly
- No lag or delay
- UI updates smoothly

**Success Criteria**: All queries are fast, indexes are used

---

### Phase 7: Security Testing (30 minutes)

#### 7.1 Test SQL Injection Protection

**Steps**:

1. Try to inject SQL in input fields:
   - Child name: `Robert'; DROP TABLE children; --`
   - Household name: `Test' OR '1'='1`
2. Verify inputs are sanitized and don't execute SQL

**Expected Results**:

- No SQL injection possible
- Supabase client parameterizes queries automatically
- Special characters are escaped

#### 7.2 Test XSS Protection

**Steps**:

1. Try to inject JavaScript in input fields:
   - Child name: `<script>alert('XSS')</script>`
   - Description: `<img src=x onerror=alert('XSS')>`
2. Verify scripts don't execute

**Expected Results**:

- Scripts are displayed as text, not executed
- React/Preact escapes output by default

#### 7.3 Test Authentication Bypass

**Steps**:

1. Sign out of the app
2. Try to access protected routes directly
3. Try to call Supabase client without authentication

**Verify in Console**:

```javascript
// Without auth, this should return empty
const { data } = await supabase
  .from('households')
  .select('*');

console.log(data); // Empty array
```

**Expected Results**:

- Cannot access data without authentication
- RLS enforces authentication requirement

#### 7.4 Test CORS Protection

**Steps**:

1. Try to access Supabase API from unauthorized domain
2. Verify request is blocked

**Expected Results**:

- Requests from unauthorized domains are blocked
- CORS headers are set correctly

**Success Criteria**: All security mechanisms work correctly

---

## Manual Testing Checklist

Use this checklist to track your testing progress:

### Database Setup
- [ ] All tables created (8 tables)
- [ ] All indexes created (38 indexes)
- [ ] All views created (10 views)
- [ ] All functions created (11+ functions)
- [ ] All triggers created (9 triggers)
- [ ] All RLS policies created (30+ policies)

### Authentication
- [ ] Magic link sign in works
- [ ] Magic link email received
- [ ] Session persists across refreshes
- [ ] Session shared across tabs
- [ ] Sign out works correctly
- [ ] Invalid links are rejected
- [ ] User record auto-created on signup

### Household Management
- [ ] Create household works
- [ ] User added as owner automatically
- [ ] Default chores created automatically
- [ ] Update household works
- [ ] Cannot delete household with last owner
- [ ] Soft delete household works

### Member Management
- [ ] Add household member works
- [ ] Owner role has full access
- [ ] Parent role has correct permissions
- [ ] Viewer role is read-only
- [ ] Cannot remove last owner
- [ ] Cannot change last owner's role (without another owner)

### Children Management
- [ ] Create child works
- [ ] Initial balances are zero
- [ ] Update child works
- [ ] Soft delete child works
- [ ] Display order is automatic
- [ ] Multiple children work correctly

### Chores Management
- [ ] Default chores created automatically
- [ ] Create custom chore works
- [ ] Update chore works
- [ ] Delete chore works
- [ ] Chore frequency works
- [ ] Chore appears for all children

### Chore Completions
- [ ] Complete chore works
- [ ] Points added to child
- [ ] Transaction created
- [ ] Completion history recorded
- [ ] Week start calculated correctly
- [ ] Cannot complete archived chore

### Money Transactions
- [ ] Add money works
- [ ] Deduct money works
- [ ] Cannot go negative (validation)
- [ ] Transaction history recorded
- [ ] Balance updates correctly
- [ ] Currency handled correctly

### Points System
- [ ] Points earned from chores
- [ ] Points balance updates
- [ ] Points transaction recorded
- [ ] Cannot go negative

### Screen Time
- [ ] Convert points to screen time works
- [ ] Screen time balance updates
- [ ] Deduct screen time works
- [ ] Cannot go negative
- [ ] Transaction recorded

### RLS Policies
- [ ] Household isolation works
- [ ] Cannot access other households
- [ ] Owner has full access
- [ ] Parent has correct access
- [ ] Viewer is read-only
- [ ] User sessions isolated
- [ ] Transactions isolated by household

### Business Logic
- [ ] Balance validation works
- [ ] Last owner protection works
- [ ] Auto-create user trigger works
- [ ] Auto-create chores trigger works
- [ ] Week start calculation works

### Performance
- [ ] Queries are fast (< 100ms)
- [ ] Indexes are used
- [ ] Views optimize complex queries
- [ ] UI is responsive
- [ ] No lag when updating data

### Security
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] CORS configured correctly

---

## Automated Testing

### Unit Tests

Create tests for core functions:

```typescript
// test/supabase.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '../src/lib/supabase';

describe('Supabase Client', () => {
  it('should be configured correctly', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should handle unauthenticated requests', async () => {
    await supabase.auth.signOut();
    const { data } = await supabase.from('households').select('*');
    expect(data).toEqual([]);
  });
});

describe('Authentication', () => {
  it('should send magic link', async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email: 'test@example.com',
    });
    expect(error).toBeNull();
  });

  it('should get session after sign in', async () => {
    // Requires valid session token
    const { data: session } = await supabase.auth.getSession();
    expect(session).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// test/households.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../src/lib/supabase';

describe('Household CRUD', () => {
  let householdId: string;

  beforeAll(async () => {
    // Sign in test user
    await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test-password',
    });
  });

  it('should create household', async () => {
    const { data, error } = await supabase.rpc('create_household', {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      household_name: 'Test Family',
      household_currency: 'GBP',
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    householdId = data;
  });

  it('should add child to household', async () => {
    const { data, error } = await supabase.rpc('add_child', {
      household_uuid: householdId,
      child_name: 'Test Child',
      child_avatar: '👶',
      child_dob: '2020-01-01',
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### E2E Tests

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should sign in with magic link', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Enter email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Send Magic Link")');

    // Verify success message
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should maintain session across refreshes', async ({ page }) => {
    // Assumes user is already signed in
    await page.goto('http://localhost:3000');

    // Verify authenticated state
    await expect(page.locator('text=Sign Out')).toBeVisible();

    // Refresh page
    await page.reload();

    // Still authenticated
    await expect(page.locator('text=Sign Out')).toBeVisible();
  });
});
```

### Run Tests

```bash
# Unit and integration tests
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:coverage
```

---

## Troubleshooting

### Issue: Migrations Failed

**Symptoms**: Tables not created, errors in SQL editor

**Solutions**:

1. Check migration order (run in sequence)
2. Check for syntax errors in SQL
3. Verify Postgres version compatibility
4. Check Supabase logs for detailed errors

```sql
-- Verify migration state
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

### Issue: RLS Blocking Valid Queries

**Symptoms**: Empty results when data should exist

**Solutions**:

1. Verify user is authenticated
2. Check household membership
3. Verify RLS policies are correct
4. Use SQL editor to test queries directly

```sql
-- Check authentication
SELECT auth.uid();

-- Check household membership
SELECT * FROM household_members WHERE user_id = auth.uid();

-- Disable RLS temporarily for testing (dev only!)
ALTER TABLE children DISABLE ROW LEVEL SECURITY;
-- Re-enable after testing
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
```

### Issue: Trigger Not Firing

**Symptoms**: Expected automatic behavior not happening

**Solutions**:

1. Verify trigger exists and is enabled
2. Check trigger function for errors
3. Test manually in SQL editor

```sql
-- Check trigger status
SELECT tgname, tgenabled, tgtype
FROM pg_trigger
WHERE tgrelid = 'children'::regclass;

-- Test trigger function manually
SELECT validate_balances();
```

### Issue: Session Not Persisting

**Symptoms**: User logged out after refresh

**Solutions**:

1. Check browser localStorage is enabled
2. Verify Supabase client configuration
3. Check for CORS issues
4. Verify auth cookies are set

```javascript
// Check localStorage
console.log(localStorage.getItem('supabase.auth.token'));

// Check session
const { data } = await supabase.auth.getSession();
console.log(data);
```

### Issue: Performance Problems

**Symptoms**: Slow queries, lag in UI

**Solutions**:

1. Check if indexes are being used
2. Optimize queries using EXPLAIN ANALYZE
3. Use views for complex queries
4. Add missing indexes

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM children WHERE household_id = '<id>';

-- Check if index is used (should see "Index Scan")

-- Create missing index if needed
CREATE INDEX idx_children_household ON children(household_id);
```

---

## Success Criteria

The migration is considered successful when:

### Functional Requirements
- [ ] All authentication flows work without errors
- [ ] All CRUD operations complete successfully
- [ ] RLS policies enforce correct access control
- [ ] Business logic triggers fire correctly
- [ ] Data integrity is maintained

### Performance Requirements
- [ ] All queries return in < 100ms
- [ ] UI is responsive and smooth
- [ ] No noticeable lag when updating data
- [ ] Page loads in < 2 seconds

### Security Requirements
- [ ] Users cannot access other households' data
- [ ] Role-based permissions work correctly
- [ ] SQL injection is prevented
- [ ] XSS is prevented
- [ ] Authentication is required for all operations

### Quality Requirements
- [ ] No console errors or warnings
- [ ] No data loss during operations
- [ ] All transactions are atomic
- [ ] No orphaned records
- [ ] Soft deletes preserve data

### User Experience
- [ ] All features work as expected
- [ ] Error messages are clear and helpful
- [ ] Loading states are shown appropriately
- [ ] Success feedback is immediate
- [ ] Navigation flows smoothly

---

## Next Steps

After completing all tests:

1. **Document Issues**: Create list of any bugs found
2. **Fix Critical Bugs**: Address blocking issues immediately
3. **Performance Tuning**: Optimize slow queries
4. **Security Review**: Double-check all RLS policies
5. **User Acceptance Testing**: Have real users test the app
6. **Deployment**: Proceed with production deployment

---

## Testing Report Template

Use this template to document your testing results:

```markdown
# Supabase Migration Testing Report

**Date**: 2025-11-24
**Tester**: [Your Name]
**Environment**: [Development/Staging/Production]

## Summary

- Tests Passed: X/Y
- Critical Issues: X
- Minor Issues: X
- Performance: [Good/Fair/Poor]

## Database Setup

- [ ] PASS: All tables created
- [ ] PASS: All indexes created
- [ ] PASS: All RLS policies created
- [ ] PASS: All functions created
- [ ] PASS: All triggers created
- [ ] PASS: All views created

## Authentication

- [ ] PASS: Magic link sign in
- [ ] PASS: Session persistence
- [ ] PASS: Sign out

## CRUD Operations

- [ ] PASS: Household creation
- [ ] PASS: Child management
- [ ] PASS: Chore management
- [ ] PASS: Transaction creation

## RLS Policies

- [ ] PASS: Household isolation
- [ ] PASS: Role-based permissions
- [ ] PASS: Session isolation

## Issues Found

### Critical
1. [Issue description]
   - Impact: [High/Medium/Low]
   - Solution: [Description]

### Minor
1. [Issue description]
   - Impact: [Low]
   - Solution: [Description]

## Performance Metrics

- Average query time: X ms
- Page load time: X seconds
- UI responsiveness: [Good/Fair/Poor]

## Recommendations

1. [Recommendation]
2. [Recommendation]

## Conclusion

[Overall assessment and go/no-go decision]
```

---

**Happy Testing!** 🧪

For questions or issues, refer to:
- [Supabase Migration Guide](/SUPABASE_MIGRATION_GUIDE.md)
- [Quick Start Guide](/SUPABASE_QUICK_START.md)
- [Supabase Documentation](https://supabase.com/docs)
