# Kids Home Hub - Test Data Summary

## Phase 5: Test Setup and Demo Data - COMPLETE ✅

All test data scripts have been created and are ready to use for development and testing.

## 📁 Files Created

```
/Users/Karim/kids-home-hub/supabase/test_data/
├── 001_test_users.sql              (5.0 KB)  - Test user accounts
├── 002_households.sql              (3.2 KB)  - Households and children
├── 003_chores.sql                  (3.5 KB)  - Default and custom chores
├── 004_transactions.sql            (16 KB)   - Transaction history (2 weeks)
├── 005_chore_completions.sql       (15 KB)   - Chore completions (2 weeks)
├── run_all.sql                     (4.6 KB)  - Master script to run all
├── QUICK_START.sql                 (6.9 KB)  - Minimal quick setup
├── README.md                       (9.9 KB)  - Complete documentation
└── SETUP_INSTRUCTIONS.md           (8.0 KB)  - Step-by-step setup guide
```

## 🎯 What's Included

### Test Users (2 families)

#### Smith Family (test1@kidshub.dev)
- **User ID**: `11111111-1111-1111-1111-111111111111`
- **Password**: `password123` (local dev only)
- **Children**:
  - **Emma** (age 8) - $25.50, 120 points, 45 min screen time
  - **Noah** (age 12) - $18.75, 95 points, 30 min screen time

#### Johnson Family (test2@kidshub.dev)
- **User ID**: `22222222-2222-2222-2222-222222222222`
- **Password**: `password123` (local dev only)
- **Children**:
  - **Olivia** (age 10) - $32.00, 150 points, 60 min screen time

### Chores (Default + Custom)

Each household has **10+ chores total**:

**Default Chores** (auto-created by trigger):
- Tidy bedroom (10 pts)
- Finish homework (8 pts)
- Set/clear table (5 pts)
- Feed pet (6 pts)
- Help with laundry (7 pts)

**Smith Family Custom Chores**:
- Practice piano (12 pts)
- Water the plants (5 pts)
- Take out recycling (8 pts)
- Read for 30 minutes (10 pts)
- Help sibling with homework (15 pts)

**Johnson Family Custom Chores**:
- Walk the dog (10 pts)
- Vacuum living room (12 pts)
- Sort and organize toys (8 pts)
- Practice math facts (10 pts)
- Make bed (5 pts)
- Empty dishwasher (7 pts)

### Transaction History

**Complete test data** includes **72 transactions** over 2 weeks:
- **Money transactions**: Allowances, bonuses, purchases
- **Points transactions**: Earned, redeemed
- **Screen time**: Earned and used

**Quick start** includes **12 transactions** over 3 days for faster setup.

### Chore Completions

**Complete test data** includes **31 chore completions** over 2 weeks:
- Emma: 9 completions
- Noah: 8 completions
- Olivia: 14 completions

**Quick start** includes no chore completions (you can add them as you test).

## 🚀 Quick Start

### For Immediate Testing

```bash
cd /Users/Karim/kids-home-hub/supabase/test_data
psql <YOUR_DATABASE_URL> -f QUICK_START.sql
```

### For Complete Test Environment

```bash
cd /Users/Karim/kids-home-hub/supabase/test_data
psql <YOUR_DATABASE_URL> -f run_all.sql
```

### Using Supabase SQL Editor

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste contents of `QUICK_START.sql` or `run_all.sql`
4. Click "Run"

## 📊 Database Stats After Loading

| Item | Quick Start | Full Data |
|------|-------------|-----------|
| Households | 2 | 2 |
| Children | 3 | 3 |
| Chores | 16-20 | 16-20 |
| Transactions | 12 | 72 |
| Chore Completions | 0 | 31 |

## 🔐 Authentication Notes

### Local Development (Supabase CLI)

Users are auto-created in `auth.users` with:
- Email: test1@kidshub.dev / test2@kidshub.dev
- Password: password123

### Hosted Supabase

You need to create auth users manually:

**Option 1: Via Dashboard** (Easiest)
1. Go to Authentication > Users
2. Click "Add User"
3. Create test1@kidshub.dev and test2@kidshub.dev
4. Copy the generated UUIDs
5. Update test data scripts with real UUIDs

**Option 2: Via Magic Links**
1. Load test data with placeholder IDs
2. Send magic links to test emails
3. Sign in and link households to real user IDs

**Option 3: Via Admin API**
```javascript
await supabase.auth.admin.createUser({
  email: 'test1@kidshub.dev',
  password: 'password123',
  email_confirm: true
})
```

See `SETUP_INSTRUCTIONS.md` for detailed steps.

## ✅ Verification

After loading test data, run this query:

```sql
SELECT
  (SELECT COUNT(*) FROM households) as households,
  (SELECT COUNT(*) FROM children) as children,
  (SELECT COUNT(*) FROM chores) as chores,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM chore_completions) as completions;
```

**Expected output**:
```
households | children | chores | transactions | completions
-----------+----------+--------+--------------+-------------
    2      |    3     |  16-20 |    12-72     |    0-31
```

View child balances:

```sql
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

**Expected output**:
```
   name   |   household    | money_total | points_total | screen_total
----------+----------------+-------------+--------------+--------------
 Emma     | Smith Family   |       25.50 |          120 |           45
 Noah     | Smith Family   |       18.75 |           95 |           30
 Olivia   | Johnson Family |       32.00 |          150 |           60
```

## 🔧 How It Works

### Automatic Triggers

The test data leverages database triggers that automatically:

1. **`on_auth_user_created`** - Creates user_profiles when auth user is created
2. **`on_household_created`** - Creates household_members and default chores
3. **`on_transaction_created`** - Updates child money/points/screen time totals
4. **`on_chore_completion_created`** - Updates child points total

### Data Relationships

```
auth.users (Supabase Auth)
    ↓
user_profiles (Optional extra metadata)
    ↓
households (Created by user)
    ↓
├── household_members (User access to household)
├── children (Kids in household)
├── chores (Available chores)
    └── chore_completions (Completed by children)
└── transactions (Money/points/screen time for children)
```

## 📖 Documentation

- **README.md** - Complete documentation of test data structure, usage, and troubleshooting
- **SETUP_INSTRUCTIONS.md** - Step-by-step setup guide with all authentication options
- **This file** - Quick visual summary of what was created

## 🧹 Resetting Test Data

### Delete Test Data Only

```sql
DELETE FROM chore_completions WHERE child_id IN (
  SELECT id FROM children WHERE household_id IN (
    SELECT id FROM households WHERE name IN ('Smith Family', 'Johnson Family')
  )
);
-- ... (see SETUP_INSTRUCTIONS.md for complete reset script)
```

### Complete Reset (Local)

```bash
supabase db reset
```

## 🎉 Next Steps

1. **Load test data** using QUICK_START.sql or run_all.sql
2. **Create auth users** via Dashboard (hosted) or sign in directly (local)
3. **Test the application**:
   - Sign in as test users
   - View household data
   - Add transactions
   - Complete chores
   - Test RLS policies
4. **Customize as needed**:
   - Add more children
   - Create custom chores
   - Generate longer transaction history

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't insert into auth.users | Create users via Dashboard or Admin API |
| UUIDs don't match | Update test data scripts with actual auth.users IDs |
| Missing default chores | Check `on_household_created` trigger is active |
| Balances incorrect | Normal - triggers modify balances automatically |
| Foreign key violations | Create auth users before loading test data |

See `SETUP_INSTRUCTIONS.md` for detailed troubleshooting.

## 📦 Migration Checklist

- [x] Phase 1: Schema migration created ✅
- [x] Phase 2: RLS policies created ✅
- [x] Phase 3: Helper functions created ✅
- [x] Phase 4: Triggers created ✅
- [x] Phase 5: Test data created ✅

**Status**: Ready for deployment and testing! 🚀

## 💡 Usage Examples

### Sign In (Local)

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test1@kidshub.dev',
  password: 'password123'
})
```

### Fetch Household

```javascript
const { data, error } = await supabase
  .from('households')
  .select('*, children(*)')
  .eq('created_by', userId)
```

### Add Transaction

```javascript
const { data, error } = await supabase
  .from('transactions')
  .insert({
    child_id: 'cccccccc-0000-0000-0000-000000000001',
    type: 'money',
    action: 'add',
    amount: 5.00,
    reason: 'Weekly allowance',
    created_by: userId
  })
```

### Complete Chore

```javascript
const { data, error } = await supabase
  .from('chore_completions')
  .insert({
    child_id: 'cccccccc-0000-0000-0000-000000000001',
    chore_id: choreId,
    chore_label: 'Tidy bedroom',
    points_earned: 10,
    week_start: '2025-11-18',
    created_by: userId
  })
```

## 📞 Support

If you encounter issues:
1. Check the documentation in `README.md` and `SETUP_INSTRUCTIONS.md`
2. Verify all migrations ran successfully
3. Check Supabase Dashboard logs
4. Ensure RLS policies are configured correctly
5. Test with Supabase SQL Editor to isolate issues

---

**Test data created**: November 24, 2025
**Ready for deployment**: Yes ✅
