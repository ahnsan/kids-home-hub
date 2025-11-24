# Test Users Summary

## Overview

This migration creates **2 test users** with **2 households** and **3 children** with realistic transaction histories spanning multiple weeks.

```
Test Environment
├── User 1: test1@kidshub.dev
│   └── Smith Family
│       ├── Emma (Age 8)
│       │   ├── Money: £12.50
│       │   ├── Points: 150
│       │   ├── Screen Time: 60 min
│       │   ├── Chores this week: 4
│       │   └── Chores last week: 5
│       │
│       └── Noah (Age 12)
│           ├── Money: £25.00
│           ├── Points: 85
│           ├── Screen Time: 30 min
│           ├── Chores this week: 2
│           └── Chores last week: 4
│
└── User 2: test2@kidshub.dev
    └── Johnson Family
        └── Olivia (Age 10)
            ├── Money: £8.75
            ├── Points: 200
            ├── Screen Time: 90 min
            ├── Chores this week: 7
            └── Chores last week: 10
```

## Data Statistics

### Database Records Created

| Table | Records | Notes |
|-------|---------|-------|
| users | 2 | Both email verified |
| households | 2 | Smith Family, Johnson Family |
| household_members | 2 | One owner per household |
| children | 3 | Ages 8, 10, 12 |
| chores | 11 | 10 default + 1 custom |
| transactions | ~80+ | All transaction types |
| chore_completions | ~40+ | Spanning 2 weeks |

### Transaction Distribution

**By Type:**
- Points transactions: ~60% (chore earnings, bonuses, deductions, redemptions)
- Money transactions: ~25% (allowances, bonuses, purchases)
- Screen time transactions: ~15% (rewards, usage)

**By Action:**
- Earn: ~85% (chores, allowances, rewards, bonuses)
- Spend: ~15% (purchases, redemptions, deductions, usage)

### Time Span
- Current week activity: ~10-15 transactions per child
- Last week activity: ~8-12 transactions per child
- Additional historical data: ~3-5 transactions per child
- Total span: Approximately 20 days

## Character Profiles

### Emma (Smith Family) - The Steady Learner
- **Age:** 8 years old
- **Personality:** Moderately active, learning responsibility
- **Allowance:** £5.00/week (age-appropriate)
- **Activity Level:** Regular but not exceptional
- **Spending:** Small purchases (candy, £1)
- **Saving:** Modest balance
- **Use Case:** Testing typical young child behavior

**Key Transactions:**
- Regular chore completion (bedroom, homework, table)
- Small allowance matching age
- Minor purchases
- Points redemption (toy)
- Screen time rewards for good behavior

### Noah (Smith Family) - The Independent Teen
- **Age:** 12 years old
- **Personality:** Less supervised, more independent
- **Allowance:** £10.00/week (double Emma's)
- **Activity Level:** Less frequent but higher value
- **Spending:** Larger purchases (game, £8)
- **Saving:** Building savings (£25)
- **Use Case:** Testing older child patterns

**Key Transactions:**
- Fewer but more valuable activities (lawn mowing, £5)
- Higher allowance appropriate for age
- Larger purchases (gaming)
- Behavioral deductions (fighting, -10 points)
- More screen time (gaming sessions)
- Special income (birthday money, £8)

### Olivia (Johnson Family) - The Overachiever
- **Age:** 10 years old
- **Personality:** Highly motivated, consistent performer
- **Allowance:** £7.50/week (middle tier)
- **Activity Level:** Very high (17 chores in 2 weeks!)
- **Spending:** Thoughtful purchases (book, £6.25)
- **Saving:** Accumulating points (200 total)
- **Use Case:** Testing high-activity scenarios

**Key Transactions:**
- Multiple daily chores
- Consistent homework completion
- Perfect week bonuses (+25 points)
- Helping behaviors (+20 points)
- Thoughtful spending (books)
- High screen time rewards (120 min for perfect week)

## Testing Scenarios Enabled

### Basic Functionality
- ✅ User authentication (2 different accounts)
- ✅ Household management (2 households)
- ✅ Child profile creation (3 different ages/profiles)
- ✅ Transaction recording (all types)
- ✅ Chore completion tracking
- ✅ Balance calculations

### Advanced Features
- ✅ Multi-child dashboard (User 1)
- ✅ Single-child dashboard (User 2)
- ✅ Weekly activity summaries
- ✅ Points leaderboards (150 vs 85 vs 200)
- ✅ Age-appropriate allowances (£5/£10/£7.50)
- ✅ Behavioral tracking (deductions/bonuses)
- ✅ Transaction history with reasons
- ✅ Screen time management
- ✅ Saving vs spending patterns

### Edge Cases & Scenarios
- ✅ Negative transactions (spending, deductions)
- ✅ Bonus rewards (perfect week)
- ✅ Behavioral penalties (fighting)
- ✅ Different activity levels (high/medium/low)
- ✅ Age-appropriate behaviors
- ✅ Week-over-week tracking
- ✅ Zero balance scenarios
- ✅ High balance scenarios (£25, 200 points)

## Quick Test Commands

### 1. Verify Users Created
```sql
SELECT email, email_verified, created_at
FROM users
WHERE email LIKE '%@kidshub.dev'
ORDER BY email;
```
**Expected:** 2 rows

### 2. Verify Children Balances
```sql
SELECT c.name, c.age,
       c.money_total, c.points_total, c.screen_total,
       h.name as household
FROM children c
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
ORDER BY h.name, c.name;
```
**Expected:** 3 rows with balances matching summary

### 3. Verify This Week's Activity
```sql
SELECT c.name,
       COUNT(*) as chores_this_week,
       SUM(points_earned) as points_this_week
FROM chore_completions cc
JOIN children c ON cc.child_id = c.id
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
  AND cc.week_start = DATE_TRUNC('week', NOW())::DATE
GROUP BY c.name
ORDER BY c.name;
```
**Expected:** Emma: 4 chores, Noah: 2 chores, Olivia: 7 chores

### 4. Verify Transaction Types
```sql
SELECT c.name,
       t.type,
       COUNT(*) as transaction_count
FROM transactions t
JOIN children c ON t.child_id = c.id
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
GROUP BY c.name, t.type
ORDER BY c.name, t.type;
```
**Expected:** Each child has points, money, and screen transactions

## Running the Migration

### Standard Method
```bash
cd /Users/Karim/kids-home-hub/apps/backend/migrations
psql $DATABASE_URL -f test-users.sql
```

### Expected Output
```
NOTICE:  User 1 created: test1@kidshub.dev
NOTICE:  Household created: Smith Family
NOTICE:  Child created: Emma
NOTICE:  Child created: Noah
NOTICE:  User 2 created: test2@kidshub.dev
NOTICE:  Household created: Johnson Family
NOTICE:  Child created: Olivia
NOTICE:  ============================================================================
NOTICE:  TEST USERS CREATED SUCCESSFULLY
NOTICE:  ============================================================================
```

## Files in This Directory

| File | Purpose |
|------|---------|
| `test-users.sql` | Main migration script (23KB) |
| `TEST_USERS.md` | Complete documentation (15KB) |
| `README.md` | Quick reference guide |
| `SUMMARY.md` | This file - visual overview |

## Key Design Decisions

### Realistic Data Patterns
- **Age-appropriate allowances:** £5 (age 8), £7.50 (age 10), £10 (age 12)
- **Varied activity levels:** High (Olivia), Medium (Emma), Low (Noah)
- **Natural behaviors:** Purchases, savings, behavioral issues
- **Time-based patterns:** Daily chores, weekly allowances, weekend rewards

### Testing Optimization
- **Two households:** Tests multi-user scenarios
- **Three children:** Tests sorting, leaderboards, comparisons
- **Multiple weeks:** Tests weekly summaries and historical data
- **All transaction types:** Complete feature coverage
- **Both actions:** Earn and spend for each type

### Database Integrity
- **Uses existing functions:** `get_or_create_user()`, `create_default_chores()`
- **Proper relationships:** All foreign keys maintained
- **Dynamic dates:** Uses NOW() for current data
- **Week calculations:** Uses PostgreSQL DATE_TRUNC
- **Transaction consistency:** Balances match transaction history

## What This Data Tests

### User Interface
- ✅ Login with multiple test accounts
- ✅ Dashboard with 1 vs 2 children
- ✅ Child profile cards with balances
- ✅ Transaction history lists
- ✅ Chore completion lists
- ✅ Weekly summary views
- ✅ Leaderboard displays

### Business Logic
- ✅ Balance calculations from transactions
- ✅ Weekly chore counting
- ✅ Points earning from chores
- ✅ Money allowance patterns
- ✅ Screen time management
- ✅ Bonus/penalty calculations
- ✅ Age-appropriate features

### Database Operations
- ✅ Complex joins across tables
- ✅ Date-based filtering (weeks)
- ✅ Aggregation queries (counts, sums)
- ✅ User-household-child hierarchy
- ✅ Transaction history ordering
- ✅ Balance consistency checks

## Next Steps After Migration

1. **Verify Data:** Run the verification queries
2. **Test Login:** Try authenticating as both users
3. **Test Dashboard:** View each household's dashboard
4. **Test Transactions:** Add new chores, allowances, etc.
5. **Test Reports:** Generate weekly summaries
6. **Test Features:** Try all app features with this data

## Support

- **Full Documentation:** [TEST_USERS.md](./TEST_USERS.md)
- **Quick Reference:** [README.md](./README.md)
- **Database Schema:** [/DATABASE_INFO.md](../../../DATABASE_INFO.md)

---

**Created:** 2025-11-24
**Version:** 1.0
**Total Records:** ~140+ across 7 tables
**Time Span:** 20 days of activity
**Maintenance:** Re-runnable (uses `get_or_create_user()`)
