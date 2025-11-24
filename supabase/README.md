# Supabase Database Migrations

Complete database migration files for Kids Home Hub, adapted for Supabase with Row Level Security, auth integration, and helper functions.

## 📁 Directory Structure

```
supabase/
├── README.md                          # This file
├── QUICK_REFERENCE.sql                # Common SQL queries
├── SCHEMA_COMPARISON.md               # Neon vs Supabase differences
└── migrations/
    ├── 001_initial_schema.sql         # Core tables and indexes
    ├── 002_rls_policies.sql           # Row Level Security policies
    ├── 003_helper_functions.sql       # Utility functions
    ├── 004_triggers.sql               # Auth integration triggers
    ├── 005_views.sql                  # Database views
    └── 999_rollback.sql               # Emergency rollback script
```

## 🚀 Quick Start

### Option A: Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### Option B: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_helper_functions.sql`
   - `004_triggers.sql`
   - `005_views.sql`

## 📋 Migration Files

### 001_initial_schema.sql
**Core Database Schema**

Creates all tables with proper constraints:
- ✅ 8 core tables (users, households, children, etc.)
- ✅ 38 optimized indexes
- ✅ Foreign key relationships
- ✅ CHECK constraints for data integrity
- ✅ Supabase Auth integration (auth.users)

**Tables created:**
- `users` - App user profiles (links to auth.users)
- `user_sessions` - Multi-device tracking
- `households` - Family households
- `household_members` - Multi-parent membership
- `children` - Child profiles with balances
- `chores` - Household chores
- `transactions` - Money/points/screen time transactions
- `chore_completions` - Chore completion history

### 002_rls_policies.sql
**Row Level Security**

Implements comprehensive security:
- ✅ RLS enabled on all tables
- ✅ 30+ security policies
- ✅ Household-based access control
- ✅ Role-based permissions (owner, parent, viewer)
- ✅ Automatic enforcement via auth.uid()

**Security Model:**
- Users can only access their household's data
- Owners can manage everything in their household
- Parents can manage children and chores
- Viewers have read-only access
- All policies use `auth.uid()` for current user

### 003_helper_functions.sql
**Utility Functions**

11 helper functions for common operations:
- ✅ `get_or_create_user()` - User management
- ✅ `create_household()` - Complete household setup
- ✅ `add_child()` - Add child with auto-ordering
- ✅ `complete_chore()` - Atomic chore completion
- ✅ `adjust_money()` - Balance-validated money transactions
- ✅ `adjust_screen_time()` - Balance-validated screen time
- ✅ `get_child_weekly_stats()` - Weekly activity analytics
- ✅ `get_household_leaderboard()` - Points leaderboard
- ✅ And more...

**All functions include:**
- Input validation
- Balance checks (prevent negatives)
- Atomic operations (all-or-nothing)
- Proper error messages

### 004_triggers.sql
**Auth Integration & Automation**

9 triggers for data integrity:
- ✅ `on_auth_user_created` - Auto-create user record on signup
- ✅ `on_auth_user_updated` - Sync auth.users changes
- ✅ `on_household_created` - Auto-setup owner and chores
- ✅ `check_last_owner_*` - Prevent orphaned households
- ✅ `validate_balances_*` - Ensure non-negative balances
- ✅ `set_chore_week_start` - Auto-calculate week start
- ✅ `update_*_updated_at` - Auto-update timestamps

**Key Benefits:**
- Automatic user record creation
- Data integrity enforcement
- Reduced application code
- Consistent behavior

### 005_views.sql
**Optimized Queries**

10 database views for common queries:
- ✅ `household_summary` - Household overview with stats
- ✅ `child_balances` - Child dashboard with activity
- ✅ `household_members_detailed` - Member details
- ✅ `recent_transactions` - Transaction feed
- ✅ `recent_chore_completions` - Completion feed
- ✅ `weekly_leaderboard` - Weekly points rankings
- ✅ `monthly_leaderboard` - Monthly points rankings
- ✅ `chore_popularity` - Chore statistics
- ✅ `user_households` - User's households with stats
- ✅ `transaction_summary` - Transaction totals by child

**Benefits:**
- Simplified queries in application code
- Optimized performance
- Consistent data formatting
- RLS automatically applied

## 🔒 Security Features

### Row Level Security (RLS)

All data access is automatically secured:

```typescript
// Application code - RLS automatic!
const { data } = await supabase
  .from('children')
  .select('*')
  .eq('household_id', householdId)

// Users can ONLY see children from their own households
// No manual authorization needed!
```

### Role-Based Access

Three levels of access:
- **Owner** - Full household control
- **Parent** - Manage children and chores
- **Viewer** - Read-only access

### Data Validation

- Balance checks prevent negative values
- Last owner protection prevents orphaned households
- Foreign key constraints ensure referential integrity
- CHECK constraints enforce valid values

## 📚 Usage Examples

### Create Household with Default Chores

```typescript
const { data: householdId } = await supabase.rpc('create_household', {
  user_id: user.id,
  household_name: 'Smith Family',
  household_currency: 'GBP'
})

// Automatically creates:
// - Household record
// - Owner membership
// - 5 default chores
```

### Add Child and Complete Chore

```typescript
// Add child
const { data: childId } = await supabase.rpc('add_child', {
  household_uuid: householdId,
  child_name: 'Emma',
  child_avatar: '👧',
  child_dob: '2015-03-15'
})

// Complete chore (atomically updates everything)
await supabase.rpc('complete_chore', {
  completion_child_id: childId,
  completion_chore_id: choreId,
  completion_created_by: user.id,
  completion_notes: 'Great job!'
})

// Automatically:
// - Records completion
// - Updates child points
// - Creates transaction
// - All atomic!
```

### Get Weekly Leaderboard

```typescript
const { data: leaderboard } = await supabase
  .from('weekly_leaderboard')
  .select('*')
  .eq('household_id', householdId)
  .order('rank')

// Returns ranked list with:
// - child_name, child_avatar
// - weekly_points, weekly_chores
// - rank
```

## 🔍 Verification

After running migrations, verify:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- Expected: 8 tables

-- Check policies
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
-- Expected: 30+ policies

-- Check functions
SELECT COUNT(*) as function_count
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f';
-- Expected: 11+ functions

-- Check triggers
SELECT COUNT(*) as trigger_count
FROM pg_trigger
WHERE tgname LIKE 'on_%' OR tgname LIKE 'check_%' OR tgname LIKE 'set_%';
-- Expected: 9+ triggers

-- Check views
SELECT COUNT(*) as view_count
FROM pg_views
WHERE schemaname = 'public';
-- Expected: 10 views
```

## 🧪 Testing

### Test Auth Integration

Sign up a user via Supabase Auth:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password'
})

// Check user record was auto-created
const { data: user } = await supabase
  .from('users')
  .select('*')
  .single()
```

### Test RLS Policies

```typescript
// Create household as User A
const { data: household } = await supabase.rpc('create_household', {
  user_id: userA.id,
  household_name: 'Test Family'
})

// Try to access as User B (should fail)
const { data: forbidden } = await supabase
  .from('households')
  .select('*')
  .eq('id', household.id)
// Result: empty (RLS blocked access)
```

## 📖 Documentation

Comprehensive guides available:

### Main Documentation
`/Users/Karim/kids-home-hub/SUPABASE_MIGRATION_GUIDE.md`
- Complete migration guide
- All functions documented
- All RLS policies explained
- Sample queries
- Troubleshooting

### Quick Reference
`/Users/Karim/kids-home-hub/supabase/QUICK_REFERENCE.sql`
- Copy-paste SQL queries
- Common operations
- Analytics examples
- Maintenance queries

### Schema Comparison
`/Users/Karim/kids-home-hub/supabase/SCHEMA_COMPARISON.md`
- Neon vs Supabase differences
- Migration path
- Breaking changes
- Application code changes

## ⚠️ Important Notes

### Auth Integration

This migration uses Supabase Auth:
- No custom magic link implementation
- No custom session management
- Users must sign up via Supabase Auth
- User records auto-created via triggers

### RLS Enforcement

RLS is **always enforced**:
- Cannot be bypassed from application
- Uses service role key to bypass (admin only)
- All queries automatically filtered
- No manual authorization checks needed

### Data Integrity

Multiple layers of protection:
- Foreign keys prevent orphaned records
- CHECK constraints enforce valid values
- Triggers validate business rules
- Helper functions ensure atomicity

## 🔧 Maintenance

### Regular Cleanup

```sql
-- Run weekly to clean up old sessions
SELECT cleanup_old_sessions(30);
```

### Monitoring

```sql
-- Check household stats
SELECT * FROM household_summary;

-- Check activity this week
SELECT
  COUNT(*) as completions,
  SUM(points_earned) as total_points
FROM chore_completions
WHERE completed_at >= NOW() - INTERVAL '7 days';
```

## 🆘 Troubleshooting

### Queries Return Empty Results

Check RLS policies:
```sql
-- Verify user is authenticated
SELECT auth.uid(); -- Should return user ID

-- Check household membership
SELECT * FROM household_members WHERE user_id = auth.uid();
```

### Trigger Not Firing

Check trigger status:
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname LIKE 'on_%';
```

### Balance Validation Errors

Ensure balances are non-negative:
```sql
-- Check child balances
SELECT id, name, money_total, points_total, screen_total
FROM children
WHERE money_total < 0 OR points_total < 0 OR screen_total < 0;
```

## 🗑️ Rollback

**⚠️ USE WITH EXTREME CAUTION**

If you need to completely reset:

```bash
# Using Supabase CLI
supabase db reset

# Or run manually
# migrations/999_rollback.sql (uncomment the DROP statements)
```

**Always backup first!**

## 📦 Environment Setup

### Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Configure Environment

`.env.local`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Initialize Client

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

## ✅ Migration Checklist

- [ ] Create Supabase project
- [ ] Run migration 001 (schema)
- [ ] Run migration 002 (RLS)
- [ ] Run migration 003 (functions)
- [ ] Run migration 004 (triggers)
- [ ] Run migration 005 (views)
- [ ] Verify tables created (8 tables)
- [ ] Verify policies created (30+ policies)
- [ ] Verify functions created (11+ functions)
- [ ] Verify triggers created (9+ triggers)
- [ ] Verify views created (10 views)
- [ ] Test auth user creation
- [ ] Test household creation
- [ ] Test RLS policies
- [ ] Update application environment variables
- [ ] Replace database client in code
- [ ] Test application functionality
- [ ] Deploy to production

## 📞 Support

For issues or questions:
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

## 🎉 Features Summary

**Schema:**
- 8 tables with 38 indexes
- Supabase Auth integration
- Multi-tenant architecture
- Soft deletes (archiving)
- JSONB for extensibility

**Security:**
- 30+ RLS policies
- Role-based access control
- Household data isolation
- Balance validation
- Last owner protection

**Functionality:**
- 11 helper functions
- 9 automatic triggers
- 10 optimized views
- Atomic operations
- Weekly analytics

**Developer Experience:**
- Auto user creation
- Auto household setup
- Simple RPC calls
- No manual authorization
- Comprehensive docs

Ready to build a secure, scalable family chore app! 🚀
