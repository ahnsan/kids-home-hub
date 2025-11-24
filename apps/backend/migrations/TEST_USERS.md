# Kids Home Hub - Test Users Documentation

This document describes the test users created for testing the Kids Home Hub application.

## Quick Reference

### Test User Credentials

| User | Email | Household | Children | Purpose |
|------|-------|-----------|----------|---------|
| User 1 | `test1@kidshub.dev` | Smith Family | Emma (8), Noah (12) | Complex testing with multiple children, diverse transaction types |
| User 2 | `test2@kidshub.dev` | Johnson Family | Olivia (10) | Simple testing with single child, high activity |

---

## User 1: Smith Family (test1@kidshub.dev)

### Purpose
This user is designed for **complex testing scenarios** with:
- Multiple children of different ages
- Varied transaction patterns between children
- Mix of active and less active children
- Different balance levels across all three features

### Household Details
- **Household Name:** Smith Family
- **Owner:** test1@kidshub.dev
- **Children Count:** 2
- **Default Chores:** 5 (standard set)
- **Custom Chores:** 1 (Water the plants)

### Child 1: Emma (Age 8)

**Current Balances:**
- **Money:** £12.50
- **Points:** 150
- **Screen Time:** 60 minutes

**Character Profile:**
- Younger child, moderately active
- Regular chore completion
- Small money balance (appropriate for age)
- Has made some purchases and redemptions

**Transaction History:**
- **This Week:**
  - 4 chores completed (Tidy bedroom, Finish homework, Set table, Feed pet)
  - 29 points earned from chores
  - 30 minutes screen time earned (behavior reward)

- **Last Week:**
  - 5 chores completed
  - 41 points earned from chores

- **Money Activity:**
  - £5.00 weekly allowance (current week)
  - £5.00 weekly allowance (last week)
  - £3.50 bonus for extra chores
  - -£1.00 spent on candy

- **Screen Time Activity:**
  - 60 minutes earned (weekend reward)
  - -30 minutes spent (watched tablet)

- **Points Activity:**
  - -20 points (redeemed for toy)

**Testing Use Cases:**
- Test moderate activity child
- Test small purchases
- Test points redemption
- Test screen time earning and spending
- Test weekly chore tracking
- Test age-appropriate allowance

---

### Child 2: Noah (Age 12)

**Current Balances:**
- **Money:** £25.00
- **Points:** 85
- **Screen Time:** 30 minutes

**Character Profile:**
- Older child, less frequent but higher-value activities
- Fewer chores but higher allowance
- Larger money balance (saving behavior)
- Some behavioral deductions

**Transaction History:**
- **This Week:**
  - 2 chores completed (Finish homework, Help with laundry)
  - 15 points earned from chores

- **Last Week:**
  - 4 chores completed
  - 33 points earned from chores

- **Money Activity:**
  - £10.00 weekly allowance (current week)
  - £10.00 weekly allowance (last week)
  - £5.00 for mowing lawn
  - £8.00 birthday money
  - -£8.00 spent on game

- **Screen Time Activity:**
  - 90 minutes earned (weekend reward)
  - -60 minutes spent (gaming session)

- **Points Activity:**
  - +15 points (helped neighbor)
  - -10 points deduction (fighting with sibling)

**Testing Use Cases:**
- Test older child with higher allowance
- Test larger purchases
- Test behavioral point deductions
- Test savings behavior (higher balance)
- Test less frequent but consistent activity
- Test gaming/screen time patterns

---

## User 2: Johnson Family (test2@kidshub.dev)

### Purpose
This user is designed for **simple testing scenarios** with:
- Single child for easier tracking
- High activity level for testing features
- Consistent chore completion pattern
- Good for testing weekly summaries and streaks

### Household Details
- **Household Name:** Johnson Family
- **Owner:** test2@kidshub.dev
- **Children Count:** 1
- **Default Chores:** 5 (standard set)
- **Custom Chores:** 0

### Child 1: Olivia (Age 10)

**Current Balances:**
- **Money:** £8.75
- **Points:** 200
- **Screen Time:** 90 minutes

**Character Profile:**
- Very diligent and active child
- Consistent daily chore completion
- High points balance (saving for big reward)
- Moderate money spending
- Earned bonus rewards for consistency

**Transaction History:**
- **This Week:**
  - 7 chores completed (multiple daily)
  - 52 points earned from chores

- **Last Week:**
  - 10 chores completed
  - 76 points earned from chores
  - +25 points bonus for perfect week

- **Money Activity:**
  - £7.50 weekly allowance (current week)
  - £7.50 weekly allowance (last week)
  - -£6.25 spent on book

- **Screen Time Activity:**
  - 120 minutes earned (perfect week reward)
  - -30 minutes spent (watched movie)

- **Points Activity:**
  - +25 points perfect week bonus
  - +20 points for helping sibling

**Testing Use Cases:**
- Test high-activity child
- Test consistent daily patterns
- Test weekly bonus/reward system
- Test points accumulation (saving behavior)
- Test streak tracking
- Test leaderboard scenarios
- Test single-child household features
- Test perfect week detection

---

## Database Schema Verification

### Current State After Migration

The test users populate all major tables:

1. **users** - 2 test users created
2. **households** - 2 households created
3. **household_members** - 2 memberships created
4. **children** - 3 children total (2 + 1)
5. **chores** - 10 default chores + 1 custom chore
6. **transactions** - Approximately 80+ transactions across all types
7. **chore_completions** - Approximately 40+ chore completions

### Transaction Type Distribution

**User 1 (Smith Family):**
- Emma: ~18 transactions (points, money, screen)
- Noah: ~15 transactions (points, money, screen)

**User 2 (Johnson Family):**
- Olivia: ~30 transactions (points, money, screen)

### Chore Completions

**User 1 (Smith Family):**
- Emma: 9 chore completions (current + last week)
- Noah: 6 chore completions (current + last week)

**User 2 (Johnson Family):**
- Olivia: 17 chore completions (current + last week)

---

## Running the Migration

### Prerequisites

1. PostgreSQL connection to Neon database
2. Database URL from `/apps/pwa/.env.local`
3. `psql` command-line tool installed

### Method 1: Using psql with Connection String

```bash
# From the project root
cd /Users/Karim/kids-home-hub

# Run the migration
psql "postgresql://neondb_owner:npg_nIT9w...@ep-young-cell-ab2lrnji-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" \
  -f apps/backend/migrations/test-users.sql
```

### Method 2: Using Database URL from Environment

```bash
# Set the DATABASE_URL environment variable
export DATABASE_URL="postgresql://neondb_owner:npg_nIT9w...@ep-young-cell-ab2lrnji-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Run the migration
psql $DATABASE_URL -f apps/backend/migrations/test-users.sql
```

### Method 3: Interactive psql Session

```bash
# Connect to database
psql "your-connection-string-here"

# Run the migration file
\i /Users/Karim/kids-home-hub/apps/backend/migrations/test-users.sql

# Verify data
\x
SELECT * FROM users WHERE email LIKE '%@kidshub.dev';
```

### Expected Output

When successful, you should see:

```
NOTICE:  User 1 created: test1@kidshub.dev (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
NOTICE:  Household created: Smith Family (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
NOTICE:  Child created: Emma (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
NOTICE:  Child created: Noah (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
NOTICE:  User 2 created: test2@kidshub.dev (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
NOTICE:  Household created: Johnson Family (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
NOTICE:  Child created: Olivia (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
NOTICE:
NOTICE:  ============================================================================
NOTICE:  TEST USERS CREATED SUCCESSFULLY
NOTICE:  ============================================================================
```

---

## Verification Queries

After running the migration, verify the data with these queries:

### 1. Check Users

```sql
SELECT email, email_verified, created_at
FROM users
WHERE email LIKE '%@kidshub.dev'
ORDER BY email;
```

**Expected:** 2 rows (test1@kidshub.dev, test2@kidshub.dev)

### 2. Check Households

```sql
SELECT h.name, u.email as owner, h.created_at
FROM households h
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
ORDER BY h.name;
```

**Expected:** 2 rows (Johnson Family, Smith Family)

### 3. Check Children with Balances

```sql
SELECT c.name, c.age, h.name as household,
       c.money_total, c.points_total, c.screen_total
FROM children c
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
ORDER BY h.name, c.name;
```

**Expected Output:**

| name | age | household | money_total | points_total | screen_total |
|------|-----|-----------|-------------|--------------|--------------|
| Olivia | 10 | Johnson Family | 8.75 | 200 | 90 |
| Emma | 8 | Smith Family | 12.50 | 150 | 60 |
| Noah | 12 | Smith Family | 25.00 | 85 | 30 |

### 4. Check Transaction Counts

```sql
SELECT c.name as child, h.name as household,
       COUNT(*) as total_transactions,
       SUM(CASE WHEN t.type = 'points' THEN 1 ELSE 0 END) as points_trans,
       SUM(CASE WHEN t.type = 'money' THEN 1 ELSE 0 END) as money_trans,
       SUM(CASE WHEN t.type = 'screen' THEN 1 ELSE 0 END) as screen_trans
FROM transactions t
JOIN children c ON t.child_id = c.id
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
GROUP BY c.name, h.name
ORDER BY h.name, c.name;
```

**Expected:** Each child should have multiple transactions across all three types

### 5. Check Chore Completions

```sql
SELECT c.name as child, h.name as household,
       COUNT(*) as total_chores_completed,
       SUM(cc.points_earned) as total_points_from_chores
FROM chore_completions cc
JOIN children c ON cc.child_id = c.id
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
GROUP BY c.name, h.name
ORDER BY h.name, c.name;
```

**Expected:** Olivia should have the most completions, followed by Emma, then Noah

### 6. Check Weekly Activity (Using View)

```sql
SELECT cb.*
FROM child_balances cb
JOIN households h ON cb.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
ORDER BY cb.household_name, cb.child_name;
```

**Expected:** Shows current balances and this week's activity for all test children

---

## Testing Scenarios

### Scenario 1: Authentication Testing
**User:** Either test1@kidshub.dev or test2@kidshub.dev
**Test:** Magic link authentication flow
**Expected:** User should be able to request and verify magic link

### Scenario 2: Multi-Child Dashboard
**User:** test1@kidshub.dev
**Test:** View dashboard with multiple children
**Expected:** See Emma and Noah with different balances

### Scenario 3: Single-Child Dashboard
**User:** test2@kidshub.dev
**Test:** View dashboard with single child
**Expected:** See Olivia with high points and activity

### Scenario 4: Transaction History
**User:** test1@kidshub.dev
**Child:** Emma
**Test:** View transaction history
**Expected:** See mix of chore earnings, money transactions, screen time

### Scenario 5: Weekly Chore Summary
**User:** test2@kidshub.dev
**Child:** Olivia
**Test:** View weekly chore completion stats
**Expected:** See 7 chores this week, 10 last week, with bonus points

### Scenario 6: Leaderboard Testing
**User:** test1@kidshub.dev
**Test:** View points leaderboard
**Expected:** Emma (150) should rank above Noah (85)

### Scenario 7: Age-Appropriate Features
**User:** test1@kidshub.dev
**Test:** Compare Emma (8) vs Noah (12) allowances and patterns
**Expected:** Noah should have higher allowance, larger purchases

### Scenario 8: Spending Behavior
**User:** test2@kidshub.dev
**Child:** Olivia
**Test:** View balance after purchase
**Expected:** Money reduced by £6.25 from book purchase

### Scenario 9: Screen Time Management
**User:** test1@kidshub.dev
**Child:** Noah
**Test:** View screen time earned vs spent
**Expected:** 90 earned, 60 spent, 30 remaining

### Scenario 10: Behavioral Tracking
**User:** test1@kidshub.dev
**Child:** Noah
**Test:** View points with deductions
**Expected:** See -10 points deduction for fighting

---

## Cleanup Script

If you need to remove the test users and start fresh:

```sql
-- WARNING: This will delete all test user data
BEGIN;

-- Get user IDs
DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
BEGIN
  SELECT id INTO v_user1_id FROM users WHERE email = 'test1@kidshub.dev';
  SELECT id INTO v_user2_id FROM users WHERE email = 'test2@kidshub.dev';

  -- Delete transactions (cascades will handle chore_completions)
  DELETE FROM transactions WHERE child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT id FROM households WHERE owner_id IN (v_user1_id, v_user2_id)
    )
  );

  -- Delete chore completions
  DELETE FROM chore_completions WHERE child_id IN (
    SELECT id FROM children WHERE household_id IN (
      SELECT id FROM households WHERE owner_id IN (v_user1_id, v_user2_id)
    )
  );

  -- Delete chores
  DELETE FROM chores WHERE household_id IN (
    SELECT id FROM households WHERE owner_id IN (v_user1_id, v_user2_id)
  );

  -- Delete children
  DELETE FROM children WHERE household_id IN (
    SELECT id FROM households WHERE owner_id IN (v_user1_id, v_user2_id)
  );

  -- Delete household members
  DELETE FROM household_members WHERE household_id IN (
    SELECT id FROM households WHERE owner_id IN (v_user1_id, v_user2_id)
  );

  -- Delete households
  DELETE FROM households WHERE owner_id IN (v_user1_id, v_user2_id);

  -- Delete sessions
  DELETE FROM user_sessions WHERE user_id IN (v_user1_id, v_user2_id);

  -- Delete magic link tokens
  DELETE FROM magic_link_tokens WHERE email IN ('test1@kidshub.dev', 'test2@kidshub.dev');

  -- Delete users
  DELETE FROM users WHERE id IN (v_user1_id, v_user2_id);

  RAISE NOTICE 'Test users and all related data deleted successfully';
END $$;

COMMIT;
```

---

## Notes

### Data Consistency
- All balances are calculated from transactions and match the current totals
- Chore completions have corresponding point transactions
- Week starts are properly calculated using PostgreSQL's DATE_TRUNC function
- All foreign key relationships are properly maintained

### Realistic Patterns
- Emma (8): Moderate activity, smaller amounts, age-appropriate behavior
- Noah (12): Less frequent, higher values, some behavioral issues (realistic)
- Olivia (10): High achiever, consistent, saving points for big reward

### Time-Based Data
- Transactions span ~20 days (current week + last week + some older)
- Week start dates are calculated dynamically relative to NOW()
- Timestamps use realistic intervals (hours between activities)

### Testing Coverage
This test data covers:
- ✓ Multiple users
- ✓ Multiple households
- ✓ Multiple children per household
- ✓ Single child per household
- ✓ All transaction types (money, points, screen time)
- ✓ All transaction actions (earn, spend)
- ✓ Chore completions with week tracking
- ✓ Default and custom chores
- ✓ Age-appropriate behaviors
- ✓ Behavioral deductions
- ✓ Bonus rewards
- ✓ Saving vs spending patterns
- ✓ Weekly activity tracking
- ✓ Multi-week history

---

## Support

If you encounter any issues with the test data:

1. Check the migration output for NOTICE messages
2. Run the verification queries to confirm data integrity
3. Verify the database connection string is correct
4. Ensure the schema is up to date (all tables exist)
5. Check that the `get_or_create_user()` function exists
6. Verify the `create_default_chores()` function exists

For database schema issues, refer to `/Users/Karim/kids-home-hub/DATABASE_INFO.md`
