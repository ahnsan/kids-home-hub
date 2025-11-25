# Test Data Setup Instructions

## Overview

This guide helps you set up test data for the Kids Home Hub application in your Supabase database.

## Prerequisites

- Supabase project created
- Database migrations deployed (`supabase/migrations/*`)
- Supabase CLI installed (optional but recommended)

## Quick Setup Options

### Option 1: Quick Start (Recommended for First-Time Setup)

**Best for**: Quick testing without auth complications

```bash
cd /Users/Karim/kids-home-hub/supabase/test_data
psql <YOUR_DATABASE_URL> -f QUICK_START.sql
```

Or via Supabase SQL Editor:
1. Open Supabase Dashboard > SQL Editor
2. Copy contents of `QUICK_START.sql`
3. Execute

**What this does**:
- Creates 2 households with 3 children
- Adds default + custom chores
- Creates sample transactions
- Sets up realistic balances
- Uses placeholder user IDs (link to real auth users later)

**Next steps after Quick Start**:
1. Create auth users manually via Supabase Dashboard
2. Update user_profiles to link real auth.users IDs (optional)
3. Start testing immediately

### Option 2: Complete Test Data

**Best for**: Full realistic testing environment

```bash
cd /Users/Karim/kids-home-hub/supabase/test_data
psql <YOUR_DATABASE_URL> -f run_all.sql
```

Or execute each script in order:
1. `001_test_users.sql`
2. `002_households.sql`
3. `003_chores.sql`
4. `005_chore_completions.sql`
5. `004_transactions.sql`

**What this includes**:
- 2 weeks of transaction history (72 transactions)
- 2 weeks of chore completions (31 completions)
- Multiple chores per household
- Realistic activity patterns

### Option 3: Using Supabase CLI

If using local development with Supabase CLI:

```bash
# Start local Supabase
supabase start

# Load test data
supabase db reset  # If migrations include test data
# OR
psql postgresql://postgres:postgres@localhost:54322/postgres -f test_data/run_all.sql
```

## Authentication Setup

### Local Development (Supabase CLI)

Test users are auto-created with these credentials:

```
Email: test1@kidshub.dev
Password: password123

Email: test2@kidshub.dev
Password: password123
```

Sign in directly using Supabase Auth:
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test1@kidshub.dev',
  password: 'password123'
})
```

### Hosted Supabase (Production/Staging)

#### Method A: Create Users via Dashboard (Easiest)

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" or "Invite User"
3. Add users:
   - `test1@kidshub.dev`
   - `test2@kidshub.dev`
4. Copy the auto-generated UUIDs
5. Update test data scripts with real UUIDs:

```sql
-- Update all references to test user IDs
-- Replace 11111111-1111-1111-1111-111111111111 with actual UUID from Dashboard
-- Replace 22222222-2222-2222-2222-222222222222 with actual UUID from Dashboard
```

6. Run test data scripts with updated IDs

#### Method B: Use Magic Links

1. Run test data scripts with placeholder IDs
2. Send magic link to test emails:
```javascript
await supabase.auth.signInWithOtp({
  email: 'test1@kidshub.dev'
})
```
3. Check email and sign in
4. Get auth user ID from dashboard
5. Link households to new user IDs:

```sql
UPDATE households
SET created_by = '<new-auth-user-id>'
WHERE created_by = '11111111-1111-1111-1111-111111111111';

UPDATE household_members
SET user_id = '<new-auth-user-id>'
WHERE user_id = '11111111-1111-1111-1111-111111111111';
```

#### Method C: Use Admin API

```javascript
const { data: user1, error } = await supabase.auth.admin.createUser({
  email: 'test1@kidshub.dev',
  password: 'password123',
  email_confirm: true,
  user_metadata: { family_name: 'Smith' }
})

const { data: user2, error: error2 } = await supabase.auth.admin.createUser({
  email: 'test2@kidshub.dev',
  password: 'password123',
  email_confirm: true,
  user_metadata: { family_name: 'Johnson' }
})

// Then update test data with real user IDs
```

## Test Data Structure

### Users & Households

| User | Email | Household | Children |
|------|-------|-----------|----------|
| User 1 | test1@kidshub.dev | Smith Family | Emma (8), Noah (12) |
| User 2 | test2@kidshub.dev | Johnson Family | Olivia (10) |

### Child Balances

| Child | Money | Points | Screen Time |
|-------|-------|--------|-------------|
| Emma | $25.50 | 120 | 45 min |
| Noah | $18.75 | 95 | 30 min |
| Olivia | $32.00 | 150 | 60 min |

### Chores

Each household has:
- **5 default chores** (auto-created by trigger)
  - Tidy bedroom (10 points)
  - Finish homework (8 points)
  - Set/clear table (5 points)
  - Feed pet (6 points)
  - Help with laundry (7 points)

- **Custom chores** (Smith: 5, Johnson: 6)
  - See `003_chores.sql` for details

## Verification

After loading test data, verify it worked:

```sql
-- Check counts
SELECT
  (SELECT COUNT(*) FROM households) as households,
  (SELECT COUNT(*) FROM children) as children,
  (SELECT COUNT(*) FROM chores) as chores,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM chore_completions) as completions;

-- View child balances
SELECT
  c.name,
  h.name as household,
  c.money_total,
  c.points_total,
  c.screen_total
FROM children c
JOIN households h ON h.id = c.household_id
ORDER BY h.name, c.name;
```

**Expected results**:
- 2 households
- 3 children
- 20+ chores (default + custom)
- 12+ transactions (Quick Start) or 72 (Full data)
- 0 or 31 chore completions (depending on which setup you used)

## Troubleshooting

### "cannot insert into auth.users"

**Cause**: Hosted Supabase doesn't allow direct auth.users inserts

**Solution**: Use Dashboard or Admin API to create users (see above)

### Balances don't match expectations

**Cause**: Triggers automatically modify balances when transactions are created

**Solution**: This is expected behavior - verify transaction history matches

### Missing default chores

**Cause**: `on_household_created` trigger didn't fire

**Solution**: Check trigger exists and is enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_household_created';
```

If missing, redeploy migrations.

### Foreign key violations

**Cause**: Referenced user IDs don't exist in auth.users

**Solution**: Create auth users first, then load test data

## Resetting Test Data

### Option 1: Delete Test Data Only

```sql
-- Run this in Supabase SQL Editor
DELETE FROM chore_completions WHERE child_id IN (
  SELECT id FROM children WHERE household_id IN (
    SELECT id FROM households WHERE name IN ('Smith Family', 'Johnson Family')
  )
);

DELETE FROM transactions WHERE child_id IN (
  SELECT id FROM children WHERE household_id IN (
    SELECT id FROM households WHERE name IN ('Smith Family', 'Johnson Family')
  )
);

DELETE FROM chores WHERE household_id IN (
  SELECT id FROM households WHERE name IN ('Smith Family', 'Johnson Family')
);

DELETE FROM children WHERE household_id IN (
  SELECT id FROM households WHERE name IN ('Smith Family', 'Johnson Family')
);

DELETE FROM household_members WHERE household_id IN (
  SELECT id FROM households WHERE name IN ('Smith Family', 'Johnson Family')
);

DELETE FROM households WHERE name IN ('Smith Family', 'Johnson Family');
```

### Option 2: Complete Database Reset (Local Only)

```bash
supabase db reset
```

This will:
- Drop all tables
- Rerun all migrations
- Optionally reload test data

## Next Steps

After loading test data:

1. **Test Authentication**
   - Try signing in as test users
   - Verify RLS policies work correctly

2. **Test API Endpoints**
   - Fetch households for user
   - Get children and their balances
   - Create transactions
   - Complete chores

3. **Test Frontend**
   - Display household data
   - Show child profiles
   - Record chore completions
   - Manage transactions

4. **Add More Data**
   - Create additional custom chores
   - Add more transactions
   - Test with longer time ranges

## Support

For issues:
- Review `README.md` in this directory
- Check Supabase logs in Dashboard
- Verify all migrations ran successfully
- Check RLS policies if data access fails

## File Reference

- `QUICK_START.sql` - Minimal setup, fastest way to get started
- `run_all.sql` - Complete test data with 2 weeks history
- `001_test_users.sql` - Test user accounts
- `002_households.sql` - Households and children
- `003_chores.sql` - Custom chores
- `004_transactions.sql` - Transaction history
- `005_chore_completions.sql` - Chore completion history
- `README.md` - Detailed documentation
- `SETUP_INSTRUCTIONS.md` - This file
