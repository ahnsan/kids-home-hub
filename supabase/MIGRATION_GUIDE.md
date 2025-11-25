# Kids Home Hub - Supabase Database Migration Guide

## Phase 4: Database Setup and Verification

This guide walks you through applying database migrations to your Supabase instance and verifying the setup.

---

## Overview

**Status**: Supabase CLI is not installed
**Solution**: Manual migration via Supabase Dashboard SQL Editor

Your Supabase instance:
- **URL**: https://qojanjzukgkkrqmnyaai.supabase.co
- **Dashboard**: https://app.supabase.com/project/qojanjzukgkkrqmnyaai

---

## Step 1: Access Supabase Dashboard

1. Open your browser and navigate to:
   ```
   https://app.supabase.com/project/qojanjzukgkkrqmnyaai
   ```

2. Log in with your Supabase credentials

3. You should see your project dashboard

---

## Step 2: Apply Database Migrations

### Option A: Using the Consolidated Script (Recommended)

1. In the Supabase Dashboard, click on **SQL Editor** in the left sidebar

2. Click **New Query** button (top right)

3. Open the file: `/Users/Karim/kids-home-hub/supabase/APPLY_MIGRATIONS.sql`

4. Copy the entire contents of the file

5. Paste it into the SQL Editor

6. Click **Run** button (bottom right)

7. Wait for execution to complete (should take 5-10 seconds)

8. You should see a success message: "Database migration completed successfully!"

### Option B: Running Individual Migration Files

If you prefer to run migrations one at a time:

1. **First**: Run `001_initial_schema.sql` - Creates tables
2. **Second**: Run `002_rls_policies.sql` - Sets up security
3. **Third**: Run `003_helper_functions.sql` - Creates functions
4. **Fourth**: Run `004_triggers.sql` - Sets up triggers
5. **Fifth**: Run `005_views.sql` - Creates views (optional)

For each file:
- Open it in your text editor
- Copy the entire contents
- Paste into SQL Editor
- Click Run
- Wait for success confirmation

---

## Step 3: Verify Migrations

1. In the SQL Editor, click **New Query**

2. Open the file: `/Users/Karim/kids-home-hub/supabase/verify_migrations.sql`

3. Copy the entire contents

4. Paste into the SQL Editor

5. Click **Run**

6. Review the results:
   - All checks should show **✓ PASS**
   - Look for "ALL CHECKS PASSED" in the summary
   - If any checks fail, review the error messages

### Expected Verification Results

```
✓ Extensions: 2/2 (uuid-ossp, pgcrypto)
✓ Tables: 8/8 (users, user_sessions, households, household_members, children, chores, transactions, chore_completions)
✓ RLS Enabled: 8/8 tables
✓ RLS Policies: 30+ policies
✓ Indexes: 20+ indexes
✓ Functions: 10+ functions
✓ Triggers: 10+ triggers
✓ Foreign Keys: 10+ constraints
✓ Check Constraints: 8+ constraints
```

---

## Step 4: Test Database Access

### Quick Test Query

Run this query in SQL Editor to confirm everything is working:

```sql
-- Test query: Check database structure
SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') AS total_tables,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS total_policies,
  (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prokind = 'f') AS total_functions;
```

Expected result:
- `total_tables`: 8
- `total_policies`: 30+
- `total_functions`: 10+

---

## Step 5: Update Backend Configuration

Now that your database is set up, update your backend environment variables:

1. Navigate to: `/Users/Karim/kids-home-hub/apps/backend/.env`

2. Update the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvamFuanp1a2dra3JxbW55YWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjQ5MjcsImV4cCI6MjA3OTUwMDkyN30.S500vXj7zBtuEGN_gG9n54ZMJCtfloNSN7kDBGTkYK8

# Get this from: Dashboard > Settings > API > service_role key (secret)
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

3. Get your Service Role Key:
   - In Supabase Dashboard, go to **Settings** (gear icon)
   - Click **API** in the sidebar
   - Under "Project API keys", find **service_role key**
   - Click the eye icon to reveal it
   - Copy and paste into your `.env` file

---

## What Was Created

### 8 Core Tables

1. **users** - Application user profiles (linked to Supabase Auth)
2. **user_sessions** - Multi-device session tracking
3. **households** - Family household management
4. **household_members** - Multi-parent/guardian memberships
5. **children** - Child profiles with balances (money, points, screen time)
6. **chores** - Custom and default chores
7. **transactions** - Unified transaction log
8. **chore_completions** - Historical chore completion records

### Row Level Security (RLS)

- All tables have RLS enabled
- 30+ security policies
- Users can only access their own household data
- Role-based permissions (owner, parent, viewer)

### Helper Functions

- `create_household()` - Create household with owner and default chores
- `complete_chore()` - Record chore completion and update balances
- `adjust_money()` - Add/deduct money with validation
- `adjust_screen_time()` - Add/deduct screen time with validation
- And more...

### Triggers

- **Auth integration** - Automatically sync Supabase Auth with app users
- **Household setup** - Auto-create default chores on household creation
- **Balance validation** - Prevent negative balances
- **Timestamp updates** - Auto-update `updated_at` columns
- **Owner protection** - Prevent removing last household owner

### Database Views (Optional)

If you ran migration 005, you also have:
- `household_summary` - Overview of household stats
- `child_balances` - Child dashboard with activity metrics
- `weekly_leaderboard` - Points leaderboard
- `monthly_leaderboard` - Monthly rankings
- And more...

---

## Troubleshooting

### Issue: "Permission denied for schema auth"

**Solution**: This is expected. The trigger will be created but may show a warning. The auth schema is managed by Supabase.

### Issue: "Relation already exists"

**Solution**: This is fine. The script uses `IF NOT EXISTS` and `DROP ... IF EXISTS` to be idempotent.

### Issue: Tables created but no data

**Solution**: This is expected. We're starting with a fresh database. Data will be created when:
1. Users sign up via Supabase Auth
2. Backend creates households and children
3. Users complete chores and add transactions

### Issue: RLS policies blocking queries

**Solution**:
- RLS policies require authentication
- Test queries in SQL Editor run as the service role (bypasses RLS)
- Backend queries will use user authentication tokens

### Issue: Auth triggers not working

**Solution**:
1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_auth_user_created';`
3. Test by signing up a test user via Supabase Auth

---

## Next Steps

1. **Test Authentication**
   - Sign up a test user via Supabase Auth
   - Verify user record created in `users` table
   - Check household auto-created

2. **Test Backend Integration**
   ```bash
   cd /Users/Karim/kids-home-hub/apps/backend
   npm test
   ```

3. **Test API Endpoints**
   - Start backend server
   - Test household creation
   - Test child management
   - Test chore completion

4. **Deploy Backend**
   - Update production environment variables
   - Deploy to your hosting platform
   - Test production database connection

---

## Optional: Install Supabase CLI

For future migrations, you can install the Supabase CLI:

### macOS
```bash
brew install supabase/tap/supabase
```

### Other platforms
See: https://supabase.com/docs/guides/cli/getting-started

### After installation
```bash
# Login
supabase login

# Link to your project
cd /Users/Karim/kids-home-hub
supabase link --project-ref qojanjzukgkkrqmnyaai

# Push migrations
supabase db push
```

---

## Support

If you encounter issues:

1. Check the Supabase Dashboard logs (Logs section in sidebar)
2. Review error messages in SQL Editor
3. Verify all environment variables are set correctly
4. Check Supabase documentation: https://supabase.com/docs

---

## Migration Files Reference

All migration files are located in: `/Users/Karim/kids-home-hub/supabase/migrations/`

- `APPLY_MIGRATIONS.sql` - Consolidated migration script (use this)
- `verify_migrations.sql` - Verification script
- `001_initial_schema.sql` - Core tables
- `002_rls_policies.sql` - Security policies
- `003_helper_functions.sql` - Utility functions
- `004_triggers.sql` - Database triggers
- `005_views.sql` - Database views
- `999_rollback.sql` - Emergency rollback (use with caution)

---

**Status**: Ready to apply migrations ✓

**Last Updated**: 2025-11-24
