# Kids Home Hub - Complete Deployment Guide

## 🎯 Overview

This guide walks you through deploying the complete Kids Home Hub database to Supabase, including migrations and test data.

## 📋 Prerequisites

- [ ] Supabase account created
- [ ] Supabase project created
- [ ] Supabase CLI installed (optional but recommended)
- [ ] PostgreSQL client (psql) or Supabase SQL Editor access

## 🚀 Deployment Steps

### Step 1: Clone or Access the Repository

```bash
cd /Users/Karim/kids-home-hub/supabase
```

### Step 2: Choose Your Deployment Method

#### Option A: Using Supabase CLI (Recommended)

```bash
# 1. Login to Supabase
supabase login

# 2. Link to your project
supabase link --project-ref <your-project-ref>

# 3. Push migrations to remote
supabase db push

# 4. (Optional) Load test data
psql <YOUR_DATABASE_URL> -f test_data/run_all.sql
```

#### Option B: Using SQL Editor (Dashboard)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Run migrations in order:

**Required Migrations** (run in order):
```
1. migrations/20251124000000_initial_schema.sql
2. migrations/20251124000001_rls_policies.sql
3. migrations/20251124000002_triggers.sql
```

**Optional Test Data** (run after migrations):
```
test_data/QUICK_START.sql (minimal)
OR
test_data/run_all.sql (complete)
```

#### Option C: Using psql Command Line

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
psql $DATABASE_URL -f migrations/20251124000000_initial_schema.sql
psql $DATABASE_URL -f migrations/20251124000001_rls_policies.sql
psql $DATABASE_URL -f migrations/20251124000002_triggers.sql

# (Optional) Load test data
psql $DATABASE_URL -f test_data/run_all.sql
```

### Step 3: Verify Deployment

Run these queries in SQL Editor to verify everything deployed correctly:

```sql
-- 1. Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: children, chore_completions, chores, household_members, households, transactions, user_profiles

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Expected: All tables should have RLS enabled

-- 3. Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected: Multiple triggers for households, children, transactions, etc.

-- 4. Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected: Helper functions like create_default_chores, handle_new_user, etc.
```

### Step 4: Set Up Test Users (If Using Test Data)

#### For Local Development

Test users are auto-created. Sign in with:
- Email: `test1@kidshub.dev` / Password: `password123`
- Email: `test2@kidshub.dev` / Password: `password123`

#### For Hosted Supabase

Choose one method:

**Method 1: Dashboard (Easiest)**
1. Go to Authentication > Users
2. Click "Add User"
3. Create:
   - `test1@kidshub.dev`
   - `test2@kidshub.dev`
4. Copy generated UUIDs
5. Update test data references (see below)

**Method 2: Magic Links**
```javascript
await supabase.auth.signInWithOtp({
  email: 'test1@kidshub.dev'
})
```

**Method 3: Admin API**
```javascript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'test1@kidshub.dev',
  password: 'password123',
  email_confirm: true
})
```

**Update Test Data with Real User IDs:**
```sql
-- After creating users, update references
UPDATE user_profiles
SET id = '<actual-auth-user-id-1>'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE households
SET created_by = '<actual-auth-user-id-1>'
WHERE created_by = '11111111-1111-1111-1111-111111111111';

-- Repeat for second user
```

### Step 5: Test the Application

#### Test Authentication

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test1@kidshub.dev',
  password: 'password123'
})
```

#### Test Data Access

```javascript
// Fetch user's households
const { data: households } = await supabase
  .from('households')
  .select('*, children(*)')
  .eq('created_by', user.id)

// Fetch children
const { data: children } = await supabase
  .from('children')
  .select('*')
  .eq('household_id', householdId)

// Add transaction
const { data: transaction } = await supabase
  .from('transactions')
  .insert({
    child_id: childId,
    type: 'money',
    action: 'add',
    amount: 5.00,
    reason: 'Weekly allowance'
  })
```

#### Test RLS Policies

Sign in as different users and verify:
- Users can only see their own households
- Users can only modify their own data
- Cross-user access is blocked

## 📊 What Gets Deployed

### Database Schema

**Tables:**
- `user_profiles` - Extended user metadata
- `households` - Family/household groups
- `household_members` - User access to households
- `children` - Kids in households
- `chores` - Available chores
- `chore_completions` - Completed chores
- `transactions` - Money/points/screen time events

**Views:**
- `household_summary` - Aggregate household stats
- `child_balances` - Current balances with weekly stats

**Functions:**
- `create_default_chores()` - Creates default chores for household
- `handle_new_user()` - Creates user profile on signup
- `update_updated_at_column()` - Updates timestamps
- `handle_transaction_update_child()` - Updates child totals
- `handle_chore_completion_update_child()` - Updates child points
- `handle_household_created()` - Sets up new household
- Plus validation functions

**Triggers:**
- Auto-create user profiles
- Auto-create household members and chores
- Auto-update child balances on transactions
- Auto-update timestamps
- Validation triggers

**RLS Policies:**
- User authentication required
- Row-level access control
- Secure data isolation

### Test Data (Optional)

**Quick Start:**
- 2 households
- 3 children
- 16-20 chores
- 12 transactions
- 0 chore completions

**Full Data:**
- 2 households
- 3 children
- 16-20 chores
- 72 transactions (2 weeks)
- 31 chore completions (2 weeks)

## 🔍 Troubleshooting

### Migration Errors

**Error: "relation already exists"**
- Solution: Tables already created. Use `999_rollback.sql` to clean up, or drop manually

**Error: "insufficient privileges"**
- Solution: Ensure you're connected as postgres user with admin rights

**Error: "function does not exist"**
- Solution: Run migrations in order. Function definitions must come before usage

### Test Data Errors

**Error: "cannot insert into auth.users"**
- Solution: Use Dashboard or Admin API to create users (see Step 4)

**Error: "foreign key violation"**
- Solution: Create auth users before loading test data

**Error: "chores not created"**
- Solution: Check `on_household_created` trigger exists and is active

### RLS Policy Issues

**Error: "new row violates row-level security policy"**
- Solution: Ensure you're authenticated and accessing your own data

**Error: "permission denied"**
- Solution: Check RLS policies are correctly configured for your use case

### Authentication Issues

**Local vs Hosted differences**
- Local: Direct auth.users access works
- Hosted: Must use Supabase Auth API/Dashboard

## 📚 Documentation Reference

### Core Docs
- `START_HERE.md` - Project overview and quick start
- `MIGRATION_GUIDE.md` - Detailed migration documentation
- `README.md` - Complete project README

### Migration Files
- `migrations/20251124000000_initial_schema.sql` - Database schema
- `migrations/20251124000001_rls_policies.sql` - Security policies
- `migrations/20251124000002_triggers.sql` - Business logic triggers

### Test Data
- `test_data/SETUP_INSTRUCTIONS.md` - Test data setup guide
- `test_data/README.md` - Test data documentation
- `test_data/QUICK_START.sql` - Minimal test data
- `test_data/run_all.sql` - Complete test data

### Quick References
- `QUICK_REFERENCE.sql` - Common queries
- `QUICK_TEST_QUERIES.sql` - Test and verification queries
- `TEST_DATA_SUMMARY.md` - Test data overview

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Supabase project created
- [ ] Database credentials obtained
- [ ] Backup existing data (if upgrading)

### Migration Deployment
- [ ] Run initial schema migration (20251124000000)
- [ ] Run RLS policies migration (20251124000001)
- [ ] Run triggers migration (20251124000002)
- [ ] Verify tables created
- [ ] Verify RLS enabled
- [ ] Verify triggers active

### Test Data (Optional)
- [ ] Create test auth users
- [ ] Load test data (QUICK_START or run_all)
- [ ] Verify test data loaded
- [ ] Update user IDs if needed

### Testing
- [ ] Test authentication works
- [ ] Test data access with RLS
- [ ] Test creating households
- [ ] Test adding children
- [ ] Test transactions
- [ ] Test chore completions
- [ ] Verify triggers work correctly

### Post-Deployment
- [ ] Document any customizations
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Update application connection strings

## 🎉 Success Indicators

Your deployment is successful when:

1. ✅ All tables created without errors
2. ✅ RLS enabled on all tables
3. ✅ Triggers active and working
4. ✅ Test users can authenticate
5. ✅ Users can create households
6. ✅ Transactions update balances automatically
7. ✅ Chore completions update points automatically
8. ✅ RLS policies prevent unauthorized access
9. ✅ Default chores auto-created for new households
10. ✅ User profiles auto-created on signup

## 🔧 Maintenance

### Regular Tasks
- Monitor database size and performance
- Review and optimize slow queries
- Check for unused indexes
- Backup database regularly

### Updates
- Test migrations in development first
- Use Supabase CLI for version control
- Document schema changes
- Maintain rollback scripts

### Monitoring
- Watch for failed triggers
- Monitor RLS policy performance
- Check auth user creation
- Review error logs

## 🆘 Getting Help

If you encounter issues:

1. **Check Documentation**
   - Review relevant .md files in `/supabase/`
   - Check Supabase official docs

2. **Verify Setup**
   - Run verification queries
   - Check Supabase Dashboard logs
   - Review migration output

3. **Common Solutions**
   - Ensure migrations ran in order
   - Verify auth users created correctly
   - Check RLS policies are active
   - Confirm triggers are enabled

4. **Rollback if Needed**
   - Use `999_rollback.sql` for clean slate
   - Redeploy from scratch

## 📞 Support Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- PostgreSQL Documentation: https://www.postgresql.org/docs/

---

**Last Updated**: November 24, 2025
**Version**: 1.0.0
**Status**: Ready for Production ✅
