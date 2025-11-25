# Kids Home Hub - Test Data

This directory contains test data scripts for populating your Supabase database with realistic sample data for development and testing.

## Overview

The test data includes:
- **2 test user accounts** (Smith and Johnson families)
- **2 households** with complete family setups
- **3 children** with realistic balances
- **Default + custom chores** for each household
- **2 weeks of transaction history** (money, points, screen time)
- **2 weeks of chore completion history**

## Quick Start

### Option 1: Run All Scripts at Once

```bash
cd /Users/Karim/kids-home-hub/supabase/test_data
psql -h <your-supabase-host> -U postgres -d postgres -f run_all.sql
```

Or via Supabase CLI:
```bash
supabase db reset  # This will run migrations + test data if configured
```

### Option 2: Run Scripts Individually

Execute in order via Supabase SQL Editor or psql:

1. `001_test_users.sql` - Creates test users and profiles
2. `002_households.sql` - Creates households and children
3. `003_chores.sql` - Creates default and custom chores
4. `005_chore_completions.sql` - Creates chore completion history
5. `004_transactions.sql` - Creates transaction history

## Test User Accounts

### User 1: Smith Family
- **Email**: `test1@kidshub.dev`
- **Password**: `password123` (local dev only)
- **User ID**: `11111111-1111-1111-1111-111111111111`
- **Children**:
  - Emma (age 8)
    - Balance: $25.50
    - Points: 120
    - Screen time: 45 minutes
  - Noah (age 12)
    - Balance: $18.75
    - Points: 95
    - Screen time: 30 minutes

### User 2: Johnson Family
- **Email**: `test2@kidshub.dev`
- **Password**: `password123` (local dev only)
- **User ID**: `22222222-2222-2222-2222-222222222222`
- **Children**:
  - Olivia (age 10)
    - Balance: $32.00
    - Points: 150
    - Screen time: 60 minutes

## Authentication Setup

### For Local Development (Supabase CLI)

The test scripts include code to create users in `auth.users` table. This works in local development:

```sql
-- Users are created automatically by 001_test_users.sql
-- Password: password123 (bcrypt encrypted)
```

### For Hosted Supabase

You have two options:

#### Option A: Magic Link Authentication (Recommended)
1. Run the test data scripts (they create `user_profiles` with fixed UUIDs)
2. Use Supabase Auth to send magic links:
   ```javascript
   const { data, error } = await supabase.auth.signInWithOtp({
     email: 'test1@kidshub.dev'
   })
   ```
3. Sign in via magic link - this creates `auth.users` entry
4. **Important**: The UUIDs won't match the test data
5. Update test data references or recreate households with new user IDs

#### Option B: Create Users via Dashboard (Easier)
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Invite User" or "Add User"
3. Create users:
   - Email: `test1@kidshub.dev`
   - Email: `test2@kidshub.dev`
4. Set auto-generated passwords or enable magic links
5. Copy the generated UUIDs
6. Update test data scripts with actual UUIDs:
   ```sql
   -- In 001_test_users.sql, 002_households.sql, etc.
   -- Replace 11111111-1111-1111-1111-111111111111 with actual UUID
   -- Replace 22222222-2222-2222-2222-222222222222 with actual UUID
   ```
7. Run the updated test data scripts

#### Option C: Use Supabase Management API

```javascript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'test1@kidshub.dev',
  password: 'password123',
  email_confirm: true,
  user_metadata: { family_name: 'Smith' }
})
```

## Test Data Details

### Chores

Each household has **default chores** (auto-created by trigger) plus **custom chores**:

#### Smith Family Chores
- **Default**: Tidy bedroom, Finish homework, Set/clear table, Feed pet, Help with laundry
- **Custom**: Practice piano, Water plants, Take out recycling, Read for 30 min, Help sibling

#### Johnson Family Chores
- **Default**: Tidy bedroom, Finish homework, Set/clear table, Feed pet, Help with laundry
- **Custom**: Walk the dog, Vacuum living room, Organize toys, Practice math, Make bed, Empty dishwasher

### Transaction History

Each child has realistic transaction history covering the last 2 weeks:

- **Money transactions**: Allowances, bonuses, purchases
- **Points transactions**: Earned from chores, redeemed for rewards
- **Screen time**: Earned and used throughout the weeks

### Chore Completions

Realistic chore completion patterns:
- **Emma**: 9 completions over 2 weeks
- **Noah**: 8 completions over 2 weeks
- **Olivia**: 14 completions over 2 weeks (most active!)

All completions include:
- Week start date (for weekly tracking)
- Points earned
- Completion timestamp
- Creator reference

## Database Triggers

The test data leverages these automatic triggers:

1. **`on_auth_user_created`**: Creates `user_profiles` entry when auth user is created
2. **`on_household_created`**: Creates household member and default chores
3. **`on_transaction_created`**: Updates child totals (money/points/screen time)
4. **`on_chore_completion_created`**: Updates child points total

## Balances Explained

The child balances in `002_households.sql` are set to values that should match the cumulative result of all transactions and chore completions. However, due to the way transactions work:

- Initial balances are set first
- Transactions then modify those balances via triggers
- Final balance = Initial + All Transaction Effects

If balances don't match expectations, this is intentional for testing the trigger logic.

## Resetting Test Data

### Complete Reset

```sql
-- Delete all test data in reverse order
DELETE FROM chore_completions WHERE child_id IN (
  SELECT id FROM children WHERE household_id IN (
    SELECT id FROM households WHERE created_by IN (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222'
    )
  )
);

DELETE FROM transactions WHERE child_id IN (
  SELECT id FROM children WHERE household_id IN (
    SELECT id FROM households WHERE created_by IN (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222'
    )
  )
);

DELETE FROM chores WHERE household_id IN (
  SELECT id FROM households WHERE created_by IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  )
);

DELETE FROM children WHERE household_id IN (
  SELECT id FROM households WHERE created_by IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  )
);

DELETE FROM household_members WHERE household_id IN (
  SELECT id FROM households WHERE created_by IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  )
);

DELETE FROM households WHERE created_by IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM user_profiles WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- Note: auth.users deletion may require admin privileges
DELETE FROM auth.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);
```

### Or Use Supabase CLI

```bash
supabase db reset  # Completely resets database and reruns migrations
```

## Verification Queries

Check that test data loaded correctly:

```sql
-- Count all data
SELECT
  (SELECT COUNT(*) FROM user_profiles) as users,
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

-- View recent transactions
SELECT
  c.name as child,
  t.type,
  t.action,
  t.amount,
  t.reason,
  t.created_at
FROM transactions t
JOIN children c ON c.id = t.child_id
ORDER BY t.created_at DESC
LIMIT 10;

-- View chore completions this week
SELECT
  c.name as child,
  cc.chore_label,
  cc.points_earned,
  cc.completed_at
FROM chore_completions cc
JOIN children c ON c.id = cc.child_id
WHERE cc.completed_at > NOW() - INTERVAL '7 days'
ORDER BY cc.completed_at DESC;
```

## Troubleshooting

### Issue: "auth.users table not accessible"

**Solution**: Create users via Supabase Dashboard or Auth API instead of direct SQL insertion.

### Issue: UUIDs don't match after creating users

**Solution**: Update all test data scripts with the actual UUIDs from `auth.users`.

### Issue: Balances don't match expectations

**Solution**: This is normal - triggers modify balances. Check transaction history to verify.

### Issue: Chores not created automatically

**Solution**: Check that the `on_household_created` trigger is active:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_household_created';
```

### Issue: Cannot delete test users

**Solution**: Use Supabase Dashboard to delete auth users, or use admin API:
```javascript
await supabase.auth.admin.deleteUser(userId)
```

## Advanced Usage

### Customizing Test Data

You can modify the scripts to:

1. **Change user emails**: Update `001_test_users.sql`
2. **Add more children**: Update `002_households.sql`
3. **Create different chores**: Update `003_chores.sql`
4. **Adjust balances**: Update `002_households.sql` and `004_transactions.sql`
5. **Change date ranges**: Modify `NOW() - INTERVAL` in transaction scripts

### Using Test Data in CI/CD

```yaml
# GitHub Actions example
- name: Setup test database
  run: |
    supabase db reset
    psql $DATABASE_URL -f supabase/test_data/run_all.sql
```

### Seeding Production-like Data

For staging environments, you can:

1. Remove the fixed UUIDs
2. Use Supabase Auth to create real users
3. Run the household/children/chores scripts with updated user IDs
4. Generate larger date ranges (e.g., 3 months instead of 2 weeks)

## Support

For issues or questions:
- Check the main project README
- Review Supabase documentation on Auth and migrations
- Verify all migrations ran successfully before loading test data

## License

Same as main project.
