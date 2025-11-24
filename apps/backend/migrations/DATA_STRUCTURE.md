# Test Data Structure Visualization

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         TEST ENVIRONMENT                         │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────┐       ┌────────────────────────────┐
│  User 1                    │       │  User 2                    │
│  test1@kidshub.dev         │       │  test2@kidshub.dev         │
└────────────┬───────────────┘       └────────────┬───────────────┘
             │                                    │
             │ owns                               │ owns
             ▼                                    ▼
┌────────────────────────────┐       ┌────────────────────────────┐
│  Household                 │       │  Household                 │
│  "Smith Family"            │       │  "Johnson Family"          │
│                            │       │                            │
│  • 5 Default Chores        │       │  • 5 Default Chores        │
│  • 1 Custom Chore          │       │                            │
└────────────┬───────────────┘       └────────────┬───────────────┘
             │                                    │
             │ has children                       │ has child
             │                                    │
      ┌──────┴──────┐                            │
      ▼             ▼                             ▼
┌──────────┐  ┌──────────┐              ┌──────────────┐
│  Emma    │  │  Noah    │              │  Olivia      │
│  Age: 8  │  │  Age: 12 │              │  Age: 10     │
└──────────┘  └──────────┘              └──────────────┘
```

## Detailed Child Profiles

### Emma (Smith Family)
```
┌─────────────────────────────────────────────────────────────────┐
│ Emma - Age 8                                                     │
│ Avatar: 👧                                                       │
├─────────────────────────────────────────────────────────────────┤
│ CURRENT BALANCES                                                │
│  💰 Money:       £12.50                                         │
│  ⭐ Points:      150                                             │
│  📺 Screen Time: 60 minutes                                     │
├─────────────────────────────────────────────────────────────────┤
│ ACTIVITY THIS WEEK                                              │
│  ✓ Tidy bedroom         (+10 points)                           │
│  ✓ Finish homework      (+8 points)                            │
│  ✓ Set table            (+5 points)                            │
│  ✓ Feed pet             (+6 points)                            │
│  ✓ Good behavior bonus  (+30 min screen time)                  │
│                                                                 │
│  Total: 4 chores, 29 points earned                             │
├─────────────────────────────────────────────────────────────────┤
│ LAST WEEK'S ACTIVITY                                            │
│  • 5 chores completed                                           │
│  • 41 points earned                                             │
├─────────────────────────────────────────────────────────────────┤
│ TRANSACTION HISTORY                                             │
│  Money:   +£5 (allowance), +£5 (allowance),                    │
│           +£3.50 (bonus), -£1 (candy)                           │
│  Screen:  +60 min (weekend), -30 min (tablet)                  │
│  Points:  -20 (toy redemption)                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Noah (Smith Family)
```
┌─────────────────────────────────────────────────────────────────┐
│ Noah - Age 12                                                    │
│ Avatar: 👦                                                       │
├─────────────────────────────────────────────────────────────────┤
│ CURRENT BALANCES                                                │
│  💰 Money:       £25.00                                         │
│  ⭐ Points:      85                                              │
│  📺 Screen Time: 30 minutes                                     │
├─────────────────────────────────────────────────────────────────┤
│ ACTIVITY THIS WEEK                                              │
│  ✓ Finish homework      (+8 points)                            │
│  ✓ Help with laundry    (+7 points)                            │
│                                                                 │
│  Total: 2 chores, 15 points earned                             │
├─────────────────────────────────────────────────────────────────┤
│ LAST WEEK'S ACTIVITY                                            │
│  • 4 chores completed                                           │
│  • 33 points earned                                             │
├─────────────────────────────────────────────────────────────────┤
│ TRANSACTION HISTORY                                             │
│  Money:   +£10 (allowance), +£10 (allowance),                  │
│           +£5 (mowed lawn), +£8 (birthday), -£8 (game)         │
│  Screen:  +90 min (weekend), -60 min (gaming)                  │
│  Points:  +15 (helped neighbor), -10 (fighting)                │
└─────────────────────────────────────────────────────────────────┘
```

### Olivia (Johnson Family)
```
┌─────────────────────────────────────────────────────────────────┐
│ Olivia - Age 10                                                  │
│ Avatar: 👧                                                       │
├─────────────────────────────────────────────────────────────────┤
│ CURRENT BALANCES                                                │
│  💰 Money:       £8.75                                          │
│  ⭐ Points:      200 ⭐ HIGHEST!                                 │
│  📺 Screen Time: 90 minutes                                     │
├─────────────────────────────────────────────────────────────────┤
│ ACTIVITY THIS WEEK                                              │
│  ✓ Tidy bedroom (2x)    (+20 points)                           │
│  ✓ Finish homework (2x) (+16 points)                           │
│  ✓ Set table (2x)       (+10 points)                           │
│  ✓ Feed pet             (+6 points)                            │
│                                                                 │
│  Total: 7 chores, 52 points earned 🏆                           │
├─────────────────────────────────────────────────────────────────┤
│ LAST WEEK'S ACTIVITY                                            │
│  • 10 chores completed 🌟                                       │
│  • 76 points earned                                             │
│  • +25 PERFECT WEEK BONUS!                                      │
├─────────────────────────────────────────────────────────────────┤
│ TRANSACTION HISTORY                                             │
│  Money:   +£7.50 (allowance), +£7.50 (allowance),              │
│           -£6.25 (book)                                         │
│  Screen:  +120 min (perfect week!), -30 min (movie)            │
│  Points:  +25 (perfect week), +20 (helped sibling)             │
└─────────────────────────────────────────────────────────────────┘
```

## Weekly Activity Comparison

```
Chore Completions (Last 2 Weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Emma    ████████████████████░░░░░░  9 chores
Noah    ████████████░░░░░░░░░░░░░░  6 chores
Olivia  ████████████████████████████  17 chores  ⭐ Most Active!

Points Earned (Current Balance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Emma    ███████████████████░░░░░░░  150 points
Noah    ██████████░░░░░░░░░░░░░░░░  85 points
Olivia  ████████████████████████████  200 points  👑 Highest!

Money Saved (Current Balance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Emma    ███████████░░░░░░░░░░░░░░░  £12.50
Noah    ████████████████████████████  £25.00  💰 Most Saved!
Olivia  ████████░░░░░░░░░░░░░░░░░░  £8.75
```

## Transaction Timeline

```
Current Week (Monday → Today)
═══════════════════════════════════════════════════════════════

Monday (2 days ago)
  Emma:    Tidy bedroom → +10 points
  Emma:    Finish homework → +8 points

Tuesday (1 day ago)
  Emma:    Set table → +5 points
  Emma:    Feed pet → +6 points
  Noah:    Finish homework → +8 points
  Olivia:  Tidy bedroom → +10 points
  Olivia:  Finish homework → +8 points
  Olivia:  Set table → +5 points

Wednesday (today)
  Emma:    Good behavior → +30 min screen time
  Noah:    Help with laundry → +7 points
  Olivia:  Tidy bedroom → +10 points
  Olivia:  Finish homework → +8 points
  Olivia:  Set table → +5 points
  Olivia:  Feed pet → +6 points

Last Week
═══════════════════════════════════════════════════════════════
  Emma:    5 chores, 41 points, £5 allowance
  Noah:    4 chores, 33 points, £10 allowance
  Olivia:  10 chores, 76 points, £7.50 allowance
           + Perfect Week Bonus: +25 points! 🎉

Older History (2-3 weeks ago)
═══════════════════════════════════════════════════════════════
  Emma:    Toy redemption (-20 points)
  Noah:    Birthday money (+£8)
  Noah:    Fighting deduction (-10 points)
  Olivia:  Helped sibling (+20 points)
```

## Allowance Structure

```
Weekly Allowance by Age
═══════════════════════════════════════════════════════════════

Age 8  (Emma)     £5.00/week   ██████████
Age 10 (Olivia)   £7.50/week   ███████████████
Age 12 (Noah)     £10.00/week  ████████████████████
```

## Database Record Counts

```
┌──────────────────────────┬─────────┬────────┬─────────┬───────┐
│ Metric                   │ Emma    │ Noah   │ Olivia  │ Total │
├──────────────────────────┼─────────┼────────┼─────────┼───────┤
│ Chore Completions        │ 9       │ 6      │ 17      │ 32    │
│ Point Transactions       │ 11      │ 8      │ 20      │ 39    │
│ Money Transactions       │ 4       │ 5      │ 3       │ 12    │
│ Screen Transactions      │ 2       │ 2      │ 2       │ 6     │
├──────────────────────────┼─────────┼────────┼─────────┼───────┤
│ Total Transactions       │ 17      │ 15     │ 25      │ 57    │
└──────────────────────────┴─────────┴────────┴─────────┴───────┘

Additional Records:
  • Users: 2
  • Households: 2
  • Household Members: 2
  • Children: 3
  • Chores: 11 (10 default + 1 custom)

Grand Total: ~110+ database records
```

## Feature Coverage Matrix

```
┌─────────────────────────────┬───────┬────────┬─────────┐
│ Feature                     │ Emma  │ Noah   │ Olivia  │
├─────────────────────────────┼───────┼────────┼─────────┤
│ Regular Chores              │ ✓✓✓   │ ✓✓     │ ✓✓✓✓✓   │
│ Points Earning              │ ✓     │ ✓      │ ✓✓      │
│ Points Spending             │ ✓     │ -      │ -       │
│ Points Deduction            │ -     │ ✓      │ -       │
│ Points Bonus                │ -     │ ✓      │ ✓✓      │
│ Weekly Allowance            │ ✓✓    │ ✓✓     │ ✓✓      │
│ Extra Income                │ ✓     │ ✓✓     │ -       │
│ Purchases                   │ ✓     │ ✓      │ ✓       │
│ Screen Time Earning         │ ✓✓    │ ✓      │ ✓       │
│ Screen Time Spending        │ ✓     │ ✓      │ ✓       │
│ Perfect Week Bonus          │ -     │ -      │ ✓       │
│ Behavioral Tracking         │ ✓     │ ✓      │ ✓       │
│ Multiple Chores/Day         │ ✓     │ -      │ ✓✓✓     │
│ Saving Behavior             │ -     │ ✓      │ ✓       │
├─────────────────────────────┼───────┼────────┼─────────┤
│ Activity Level              │ Med   │ Low    │ High    │
│ Age Group                   │ Young │ Older  │ Middle  │
│ Testing Focus               │ Basic │ Teen   │ Power   │
└─────────────────────────────┴───────┴────────┴─────────┘

Legend: ✓ = Featured, ✓✓ = Multiple instances, - = Not featured
```

## Test Scenario Examples

### Scenario 1: Leaderboard Display
```
Position  Child    Points  Screen   Money
───────────────────────────────────────────
🥇  1st   Olivia    200    90 min   £8.75
🥈  2nd   Emma      150    60 min   £12.50
🥉  3rd   Noah       85    30 min   £25.00
```

### Scenario 2: This Week's Activity
```
Most Active:    Olivia (7 chores) 🌟
Most Improved:  Emma (4 chores, +29 pts)
Needs Boost:    Noah (2 chores)
```

### Scenario 3: Money Management
```
Biggest Saver:   Noah (£25.00) 💰
Recent Spender:  Olivia (-£6.25 on book) 📚
Smart Shopper:   Emma (small purchases)
```

### Scenario 4: Parent Dashboard Overview
```
SMITH FAMILY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Children: 2
  Active This Week: 2/2
  Chores Completed: 6
  Allowances Due: £15.00 (next Monday)

  Recent Activity:
  • Emma completed 4 chores (+29 points)
  • Noah completed 2 chores (+15 points)
  • Emma earned screen time bonus

JOHNSON FAMILY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Children: 1
  Active This Week: 1/1
  Chores Completed: 7
  Allowances Due: £7.50 (next Monday)

  Recent Activity:
  • Olivia on fire! 7 chores this week! 🔥
  • On track for another perfect week bonus
```

## Data Integrity Checks

```sql
-- Balance verification (should all be TRUE)
SELECT
  c.name,
  c.points_total = (
    SELECT COALESCE(SUM(CASE
      WHEN t.action = 'earn' THEN t.amount
      WHEN t.action = 'spend' THEN -t.amount
    END), 0)
    FROM transactions t
    WHERE t.child_id = c.id AND t.type = 'points'
  ) as points_match,
  c.money_total = (
    SELECT COALESCE(SUM(CASE
      WHEN t.action = 'earn' THEN t.amount
      WHEN t.action = 'spend' THEN t.amount
    END), 0)
    FROM transactions t
    WHERE t.child_id = c.id AND t.type = 'money'
  ) as money_match
FROM children c;

-- Expected result: All TRUE values
```

## Use This Data To Test

1. **Authentication**: Login as test1 or test2
2. **Multi-child views**: Compare Emma vs Noah
3. **Activity levels**: See Olivia's high activity
4. **Transactions**: Browse detailed histories
5. **Weekly summaries**: Check this week vs last week
6. **Leaderboards**: Sort by points/money/screen time
7. **Age differences**: Compare behaviors by age
8. **Edge cases**: Deductions, bonuses, redemptions
9. **Reporting**: Generate weekly/monthly reports
10. **Analytics**: Track trends over time

---

**Visual Legend:**
- 👧 = Young girl avatar
- 👦 = Young boy avatar
- ⭐ = Points/achievements
- 💰 = Money/savings
- 📺 = Screen time
- 🏆 = Competition/leader
- 🌟 = Exceptional performance
- 🔥 = Hot streak
- 👑 = Highest in category
