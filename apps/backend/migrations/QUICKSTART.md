# Quick Start Guide - Test Users

## Run the Migration (Easiest Method)

```bash
cd /Users/Karim/kids-home-hub/apps/backend/migrations
./run-test-users.sh
```

The script will:
1. ✓ Check prerequisites (psql installed)
2. ✓ Find your database connection automatically
3. ✓ Test the connection
4. ✓ Ask for confirmation
5. ✓ Run the migration
6. ✓ Show success summary

## Test Users Created

| Email | Password | Household | Children |
|-------|----------|-----------|----------|
| `test1@kidshub.dev` | Magic link | Smith Family | Emma (8), Noah (12) |
| `test2@kidshub.dev` | Magic link | Johnson Family | Olivia (10) |

## Login Instructions

Since this app uses **passwordless authentication** (magic links):

1. Go to your app's login page
2. Enter email: `test1@kidshub.dev` or `test2@kidshub.dev`
3. Check your database for the magic link token:

```sql
SELECT token, expires_at
FROM magic_link_tokens
WHERE email = 'test1@kidshub.dev'
ORDER BY created_at DESC
LIMIT 1;
```

4. Use that token to verify authentication

**OR** if your app is set up for development:
- Bypass authentication in development mode
- Use session tokens directly

## What You'll See

### User 1: test1@kidshub.dev (Smith Family)

**Dashboard View:**
```
Smith Family
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Emma (👧 Age 8)
  Money: £12.50  |  Points: 150  |  Screen: 60 min
  This week: 4 chores completed

Noah (👦 Age 12)
  Money: £25.00  |  Points: 85  |  Screen: 30 min
  This week: 2 chores completed
```

### User 2: test2@kidshub.dev (Johnson Family)

**Dashboard View:**
```
Johnson Family
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olivia (👧 Age 10)
  Money: £8.75  |  Points: 200  |  Screen: 90 min
  This week: 7 chores completed ⭐ High performer!
```

## Quick Tests You Can Run

### 1. View All Test Children
```sql
SELECT c.name, c.age, h.name as household,
       c.money_total, c.points_total, c.screen_total
FROM children c
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
ORDER BY h.name, c.name;
```

### 2. Check Recent Activity
```sql
SELECT c.name, t.type, t.action, t.amount, t.reason, t.created_at
FROM transactions t
JOIN children c ON t.child_id = c.id
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
ORDER BY t.created_at DESC
LIMIT 10;
```

### 3. See Chore Completions This Week
```sql
SELECT c.name, COUNT(*) as chores_this_week,
       SUM(cc.points_earned) as points_earned
FROM chore_completions cc
JOIN children c ON cc.child_id = c.id
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
  AND cc.week_start = DATE_TRUNC('week', NOW())::DATE
GROUP BY c.name
ORDER BY chores_this_week DESC;
```

**Expected Output:**
- Olivia: 7 chores, 52 points
- Emma: 4 chores, 29 points
- Noah: 2 chores, 15 points

## Testing Different Features

### Test Case 1: Multi-Child Management
- **Login as:** test1@kidshub.dev
- **What to test:** Dashboard with 2 children, comparing balances
- **Expected:** Emma and Noah with different activity levels

### Test Case 2: High Activity Child
- **Login as:** test2@kidshub.dev
- **What to test:** Single high-performing child
- **Expected:** Olivia with 200 points, 7 chores this week

### Test Case 3: Transaction History
- **Login as:** test1@kidshub.dev
- **Child:** Emma
- **What to test:** View all transactions
- **Expected:** Mix of chores, allowances, purchases, screen time

### Test Case 4: Leaderboard
- **Login as:** test1@kidshub.dev
- **What to test:** Points leaderboard
- **Expected:** Emma (150) ranked above Noah (85)

### Test Case 5: Age-Appropriate Allowances
- **Login as:** test1@kidshub.dev
- **What to test:** Compare Emma's £5/week vs Noah's £10/week
- **Expected:** Different allowance amounts based on age

## Troubleshooting

### Migration Failed?
1. Check database connection:
   ```bash
   psql "postgresql://..." -c "SELECT version();"
   ```

2. Verify schema exists:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   Expected: users, households, children, transactions, etc.

3. Check if `get_or_create_user()` function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name = 'get_or_create_user';
   ```

### Users Already Exist?
No problem! The migration uses `get_or_create_user()` which is idempotent.
It will reuse existing users with those email addresses.

To start fresh, run the cleanup script from TEST_USERS.md.

### Can't Login?
The app uses **magic link authentication**. In development:
- Check your auth implementation
- You may need to create a session manually
- Or bypass auth for testing

## Next Steps

1. ✅ Migration completed
2. ⏭️ Test authentication with test users
3. ⏭️ View dashboards for each household
4. ⏭️ Try adding new transactions
5. ⏭️ Test chore completion
6. ⏭️ Generate weekly reports
7. ⏭️ Test all features with realistic data

## Need More Info?

- **Quick Reference:** [README.md](./README.md)
- **Complete Documentation:** [TEST_USERS.md](./TEST_USERS.md)
- **Visual Overview:** [SUMMARY.md](./SUMMARY.md)
- **Data Structure:** [DATA_STRUCTURE.md](./DATA_STRUCTURE.md)
- **Database Schema:** [/DATABASE_INFO.md](../../../DATABASE_INFO.md)

## One-Liner Cheat Sheet

```bash
# Run migration
./run-test-users.sh

# Verify data
psql $DATABASE_URL -c "SELECT email FROM users WHERE email LIKE '%@kidshub.dev';"

# Quick stats
psql $DATABASE_URL -c "SELECT c.name, c.points_total, c.money_total FROM children c JOIN households h ON c.household_id = h.id JOIN users u ON h.owner_id = u.id WHERE u.email LIKE '%@kidshub.dev' ORDER BY c.points_total DESC;"

# Clean up
psql $DATABASE_URL -f cleanup.sql  # (create this from TEST_USERS.md if needed)
```

---

**That's it!** You now have 2 complete test users with realistic data ready for testing. 🎉

**Pro Tip:** Olivia (test2@kidshub.dev) is the power user with 200 points and 17 chores. Use her account to test high-activity scenarios!
