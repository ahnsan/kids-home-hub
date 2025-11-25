# Test Data - Quick Reference Card

## 🚀 Quick Setup Commands

### Option 1: Minimal Data (Fastest)
```bash
psql <DB_URL> -f QUICK_START.sql
```

### Option 2: Complete Data (Full History)
```bash
psql <DB_URL> -f run_all.sql
```

### Option 3: Via Supabase SQL Editor
1. Copy contents of `QUICK_START.sql` or `run_all.sql`
2. Paste into SQL Editor
3. Click "Run"

---

## 👥 Test User Accounts

| User | Email | Password | UUID (Local) |
|------|-------|----------|--------------|
| Smith Family | test1@kidshub.dev | password123 | 11111111-1111-1111-1111-111111111111 |
| Johnson Family | test2@kidshub.dev | password123 | 22222222-2222-2222-2222-222222222222 |

**Note**: Passwords only work in local dev. For hosted Supabase, create users via Dashboard.

---

## 👶 Test Children

| Child | Age | Household | Money | Points | Screen Time |
|-------|-----|-----------|-------|--------|-------------|
| Emma | 8 | Smith | $25.50 | 120 | 45 min |
| Noah | 12 | Smith | $18.75 | 95 | 30 min |
| Olivia | 10 | Johnson | $32.00 | 150 | 60 min |

---

## 📊 Test Data Contents

| Item | Quick Start | Full Data |
|------|-------------|-----------|
| Households | 2 | 2 |
| Children | 3 | 3 |
| Chores | 16-20 | 16-20 |
| Transactions | 12 (3 days) | 72 (2 weeks) |
| Completions | 0 | 31 (2 weeks) |

---

## ✅ Verification Query

```sql
SELECT
  (SELECT COUNT(*) FROM households) as households,
  (SELECT COUNT(*) FROM children) as children,
  (SELECT COUNT(*) FROM chores) as chores,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM chore_completions) as completions;
```

**Expected**: 2 households, 3 children, 16-20 chores, 12-72 transactions, 0-31 completions

---

## 🔑 UUIDs Reference

| Entity | UUID |
|--------|------|
| User 1 | `11111111-1111-1111-1111-111111111111` |
| User 2 | `22222222-2222-2222-2222-222222222222` |
| Household 1 (Smith) | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` |
| Household 2 (Johnson) | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` |
| Child 1 (Emma) | `cccccccc-0000-0000-0000-000000000001` |
| Child 2 (Noah) | `cccccccc-0000-0000-0000-000000000002` |
| Child 3 (Olivia) | `cccccccc-0000-0000-0000-000000000003` |

---

## 🔐 Create Auth Users (Hosted Only)

### Via Dashboard
1. Go to Authentication > Users
2. Click "Add User"
3. Enter test emails
4. Copy generated UUIDs
5. Update test data references

### Via Admin API
```javascript
const { data } = await supabase.auth.admin.createUser({
  email: 'test1@kidshub.dev',
  password: 'password123',
  email_confirm: true
})
```

### Via Magic Link
```javascript
await supabase.auth.signInWithOtp({
  email: 'test1@kidshub.dev'
})
```

---

## 📝 Common Queries

### View Balances
```sql
SELECT c.name, h.name as household, c.money_total, c.points_total, c.screen_total
FROM children c
JOIN households h ON h.id = c.household_id
ORDER BY h.name, c.name;
```

### Recent Transactions
```sql
SELECT c.name, t.type, t.action, t.amount, t.reason, t.created_at
FROM transactions t
JOIN children c ON c.id = t.child_id
ORDER BY t.created_at DESC
LIMIT 10;
```

### This Week's Chores
```sql
SELECT c.name, cc.chore_label, cc.points_earned, cc.completed_at
FROM chore_completions cc
JOIN children c ON c.id = cc.child_id
WHERE cc.completed_at > NOW() - INTERVAL '7 days'
ORDER BY cc.completed_at DESC;
```

---

## 🧹 Reset Commands

### Delete Test Data Only
```sql
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

### Complete Reset (Local Only)
```bash
supabase db reset
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "cannot insert into auth.users" | Create users via Dashboard/API |
| Foreign key violations | Create auth users first |
| Missing default chores | Check `on_household_created` trigger |
| Wrong balances | Normal - triggers modify balances |
| Permission denied | Check RLS policies are active |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| SETUP_INSTRUCTIONS.md | Complete setup guide |
| README.md | Full documentation |
| QUICK_START.sql | Minimal test data |
| run_all.sql | Complete test data |

---

## 🎯 File Loading Order

When running manually:
1. `001_test_users.sql` - Users
2. `002_households.sql` - Households & children
3. `003_chores.sql` - Custom chores
4. `005_chore_completions.sql` - Completions
5. `004_transactions.sql` - Transactions

Or just use `run_all.sql` to load everything.

---

## ⚡ Quick Test

After loading data:

```javascript
// Sign in
const { data } = await supabase.auth.signInWithPassword({
  email: 'test1@kidshub.dev',
  password: 'password123'
})

// Fetch household
const { data: households } = await supabase
  .from('households')
  .select('*, children(*)')

// Add transaction
const { data: transaction } = await supabase
  .from('transactions')
  .insert({
    child_id: 'cccccccc-0000-0000-0000-000000000001',
    type: 'money',
    action: 'add',
    amount: 5.00,
    reason: 'Test transaction'
  })
```

---

**Quick Reference Version**: 1.0
**Last Updated**: November 24, 2025
