# Test Data Loading Guide

This guide walks you through loading test data into your Supabase database for immediate testing.

---

## Overview

The test data script creates:
- **2 Households:** Smith Family and Johnson Family
- **3 Children:** Emma, Noah, and Olivia (with realistic balances)
- **Default Chores:** Auto-created by database triggers (5 per household)
- **Custom Chores:** Additional household-specific chores
- **Recent Transactions:** Last 3 days of activity for each child

---

## Before You Start

### Prerequisites
- [x] Migration script applied successfully (APPLY_MIGRATIONS.sql)
- [x] Database verification completed (quick_check.sql)
- [x] Supabase project accessible: https://qojanjzukgkkrqmnyaai.supabase.co

### Important Note
The test data uses **placeholder user IDs** that don't link to actual auth.users. This is intentional for quick testing without auth complications.

---

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Navigate to your Supabase project: https://qojanjzukgkkrqmnyaai.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query** button

### Step 2: Load the Test Data Script

**File Location:**
```
/Users/Karim/kids-home-hub/supabase/test_data/QUICK_START.sql
```

**Option A: Copy and Paste**
1. Open the file in your text editor
2. Copy all contents (lines 1-159)
3. Paste into Supabase SQL Editor

**Option B: Upload File**
1. In SQL Editor, click the "..." menu
2. Select "Upload SQL file"
3. Choose QUICK_START.sql

### Step 3: Review the Script (Optional)

The script includes sections for:
- Cleanup commands (commented out by default)
- User profile placeholders
- Household creation
- Children creation
- Custom chores
- Sample transactions
- Verification queries

### Step 4: Execute the Script

1. Click the **RUN** button (or press Cmd/Ctrl + Enter)
2. Wait for execution to complete (should take 2-3 seconds)
3. Check the results panel at the bottom

### Step 5: Verify Success

You should see output like:
```
Setup Complete!
households: 2
children: 3
chores: 16
transactions: 12
```

---

## What Gets Created

### Smith Family Household
**ID:** `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
**Created By:** User ID `11111111-1111-1111-1111-111111111111`

**Children:**
- **Emma** (👧)
  - Money: £25.50
  - Points: 120
  - Screen Time: 45 minutes

- **Noah** (👦)
  - Money: £18.75
  - Points: 95
  - Screen Time: 30 minutes

**Default Chores (auto-created):**
- Tidy bedroom (10 points)
- Finish homework (8 points)
- Set/clear the table (5 points)
- Feed pet/help pet (6 points)
- Help with laundry (7 points)

**Custom Chores:**
- Practice piano (12 points)
- Water the plants (5 points)
- Take out recycling (8 points)
- Read for 30 minutes (10 points)
- Help sibling with homework (15 points)

### Johnson Family Household
**ID:** `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`
**Created By:** User ID `22222222-2222-2222-2222-222222222222`

**Children:**
- **Olivia** (🧒)
  - Money: £32.00
  - Points: 150
  - Screen Time: 60 minutes

**Default Chores (auto-created):**
- Same 5 default chores as Smith Family

**Custom Chores:**
- Walk the dog (10 points)
- Vacuum living room (12 points)
- Sort and organize toys (8 points)
- Practice math facts (10 points)
- Make bed (5 points)
- Empty dishwasher (7 points)

### Recent Transactions
Each child has 4 recent transactions:
- Points earned from chores
- Weekly allowance (money)
- Screen time bonuses
- Recent chore completions

---

## Verifying Test Data

### Quick Verification in SQL Editor

```sql
-- Check all data loaded
SELECT
  'users' as table_name,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 'households', COUNT(*) FROM households
UNION ALL
SELECT 'children', COUNT(*) FROM children
UNION ALL
SELECT 'chores', COUNT(*) FROM chores
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;
```

Expected results:
- users: 2
- households: 2
- children: 3
- chores: 16 (10 default + 6 custom)
- transactions: 12

### Verify Children Balances

```sql
SELECT
  name,
  money_total,
  points_total,
  screen_total
FROM children
ORDER BY name;
```

Expected:
- Emma: £25.50, 120 points, 45 min
- Noah: £18.75, 95 points, 30 min
- Olivia: £32.00, 150 points, 60 min

### Verify Household Membership

```sql
SELECT
  h.name as household,
  u.email as user_email,
  hm.role
FROM households h
JOIN household_members hm ON h.id = hm.household_id
JOIN users u ON hm.user_id = u.id
ORDER BY h.name;
```

---

## Understanding Placeholder Users

The test data creates users with these IDs:
- `11111111-1111-1111-1111-111111111111` (Smith Family owner)
- `22222222-2222-2222-2222-222222222222` (Johnson Family owner)

### Why Placeholders?

1. **Quick Testing:** No need to create auth.users first
2. **Schema Testing:** Test database structure without auth complications
3. **Trigger Testing:** Verify that triggers and constraints work

### Linking to Real Auth Users (Later)

When you're ready to use real authentication:

```sql
-- Create auth user in Supabase Dashboard first
-- Then update the user profile:

UPDATE users
SET id = '<actual-auth-user-id-from-supabase>'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Also update household_members
UPDATE household_members
SET user_id = '<actual-auth-user-id-from-supabase>'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- And update transactions
UPDATE transactions
SET created_by = '<actual-auth-user-id-from-supabase>'
WHERE created_by = '11111111-1111-1111-1111-111111111111';
```

---

## Cleaning Up Test Data

If you want to remove test data and start fresh:

### Option 1: Delete All Data

Uncomment the cleanup section in QUICK_START.sql (lines 26-34) and re-run:

```sql
DELETE FROM chore_completions;
DELETE FROM transactions;
DELETE FROM chores;
DELETE FROM children;
DELETE FROM household_members;
DELETE FROM households;
DELETE FROM users;
```

### Option 2: Selective Deletion

Delete specific households:

```sql
-- Delete Smith Family
DELETE FROM households
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Delete Johnson Family
DELETE FROM households
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Due to CASCADE, this will also delete:
-- - household_members
-- - children
-- - chores
-- - transactions
-- - chore_completions
```

---

## Testing with Test Data

### Test Household Access

```sql
-- View all households (as specific user)
SELECT * FROM households
WHERE created_by = '11111111-1111-1111-1111-111111111111';
```

### Test Child Queries

```sql
-- View children in Smith Family
SELECT * FROM children
WHERE household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY display_order;
```

### Test Transaction History

```sql
-- View Emma's recent transactions
SELECT
  type,
  action,
  amount,
  reason,
  created_at
FROM transactions
WHERE child_id = 'cccccccc-0000-0000-0000-000000000001'
ORDER BY created_at DESC;
```

### Test Chore Completions

```sql
-- View all chores for Smith Family
SELECT
  label,
  points,
  icon,
  category,
  is_default
FROM chores
WHERE household_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY category, label;
```

---

## Next Steps After Loading Test Data

1. **Enable Authentication**
   - See: AUTH_CONFIGURATION_GUIDE.md
   - Enable email authentication in Supabase Dashboard

2. **Test API Endpoints**
   - Use test data IDs to test backend API
   - Verify RLS policies work correctly

3. **Create Real Users**
   - Sign up via your frontend
   - Create real households
   - Link or replace test data

4. **Test Frontend Integration**
   - Configure SUPABASE_URL and SUPABASE_ANON_KEY
   - Test user signup/login flow
   - Test household and child management

---

## Troubleshooting

### Error: "users" table does not exist
**Solution:** Run the migration script first (APPLY_MIGRATIONS.sql)

### Error: Foreign key violation
**Solution:** The script uses placeholder user IDs. Make sure you're not trying to create real auth.users with these IDs.

### Error: Duplicate key value
**Solution:** Test data already loaded. Either skip or run cleanup section first.

### No data visible in frontend
**Solution:**
1. Check RLS policies are correct
2. Ensure user is authenticated
3. Verify user_id matches household_members.user_id
4. Check SUPABASE_URL and SUPABASE_ANON_KEY in frontend

---

## Support

If you encounter issues:
1. Run quick_check.sql to verify database state
2. Check Supabase logs (Dashboard > Database > Logs)
3. Verify RLS policies in Table Editor
4. Review test data IDs match your queries

---

**Status:** Ready to Load Test Data
**File:** /Users/Karim/kids-home-hub/supabase/test_data/QUICK_START.sql
**Project:** https://qojanjzukgkkrqmnyaai.supabase.co
