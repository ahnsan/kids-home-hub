# Kids Home Hub - Database Migration Quick Start

## 🚀 Quick Start (5 Minutes)

Follow these steps to set up your Supabase database:

---

## Step 1: Apply Migrations (3 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/project/qojanjzukgkkrqmnyaai

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run Migration Script**
   - Open: `APPLY_MIGRATIONS.sql` (this folder)
   - Copy all contents (Cmd+A, Cmd+C)
   - Paste into SQL Editor (Cmd+V)
   - Click "Run" button
   - Wait for success message ✓

---

## Step 2: Verify Setup (1 minute)

1. **Open New Query**
   - Click "New Query" again

2. **Run Verification Script**
   - Open: `verify_migrations.sql` (this folder)
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run"
   - Check all results show "✓ PASS"

---

## Step 3: Update Backend (1 minute)

1. **Get Service Key**
   - In Dashboard: Settings > API
   - Copy "service_role key" (click eye icon)

2. **Update .env**
   - Open: `apps/backend/.env`
   - Add these lines:
   ```env
   SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvamFuanp1a2dra3JxbW55YWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjQ5MjcsImV4cCI6MjA3OTUwMDkyN30.S500vXj7zBtuEGN_gG9n54ZMJCtfloNSN7kDBGTkYK8
   SUPABASE_SERVICE_KEY=<paste-your-service-key-here>
   ```

---

## ✅ Done!

Your database is now ready. You have:
- 8 tables for households, children, chores, and transactions
- 30+ security policies for data protection
- 10+ helper functions for common operations
- Automatic triggers for auth and validation

---

## 📚 Need More Help?

- **Detailed Guide**: See `MIGRATION_GUIDE.md`
- **Test Queries**: See `QUICK_TEST_QUERIES.sql`
- **Full Summary**: See `PHASE_4_COMPLETE.md`

---

## 🧪 Quick Test

After setup, test with this query in SQL Editor:

```sql
-- Check everything is working
SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') AS tables,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS policies,
  (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace) AS functions;
```

**Expected result**:
- tables: 8
- policies: 30+
- functions: 10+

---

## ⚠️ Troubleshooting

**See warnings about auth schema?**
- Normal - auth schema is managed by Supabase

**Tables already exist?**
- No problem - script is safe to run multiple times

**Need help?**
- Check `MIGRATION_GUIDE.md` for common issues

---

**Total Time**: 5 minutes
**Difficulty**: Easy (just copy & paste!)

Let's go! 🎉
