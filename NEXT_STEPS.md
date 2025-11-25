# Next Steps - Post Migration Guide

**Date:** 2025-11-24
**Supabase Project:** https://qojanjzukgkkrqmnyaai.supabase.co
**Status:** Migrations Applied ✓

This document provides a clear, numbered list of what you need to do next to get your Kids Home Hub application fully operational.

---

## Quick Summary

Your database migrations have been applied successfully. Now you need to:
1. Verify the migration worked
2. Load test data
3. Configure authentication
4. Set up environment variables
5. Test the application

**Total Estimated Time:** 30-45 minutes

---

## Step 1: Verify Database Migration (5 minutes)

### What to do:
Run the verification script to ensure all tables, policies, and triggers are in place.

### How to do it:

1. Navigate to Supabase Dashboard: https://qojanjzukgkkrqmnyaai.supabase.co
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Open file: `/Users/Karim/kids-home-hub/supabase/quick_check.sql`
5. Copy all contents and paste into SQL Editor
6. Click **RUN** button

### Expected Results:

You should see:
- ✓ 8 tables created
- ✓ 30+ RLS policies active
- ✓ 6+ functions available
- ✓ 10+ triggers installed
- ✓ 25+ indexes created

### If Something's Wrong:

- Review migration script: `/Users/Karim/kids-home-hub/supabase/APPLY_MIGRATIONS.sql`
- Check Supabase logs: Dashboard > Logs > Database
- Re-run the migration script (it's idempotent - safe to run multiple times)

### Reference:
- Full verification guide: `/Users/Karim/kids-home-hub/MIGRATION_STATUS.md`

---

## Step 2: Load Test Data (5 minutes)

### What to do:
Load sample households, children, and chores for immediate testing.

### How to do it:

1. Stay in **SQL Editor** in Supabase
2. Click **New Query**
3. Open file: `/Users/Karim/kids-home-hub/supabase/test_data/QUICK_START.sql`
4. Copy all contents and paste into SQL Editor
5. Click **RUN** button

### What Gets Created:

**Smith Family Household:**
- 2 children: Emma (£25.50, 120 points) and Noah (£18.75, 95 points)
- 10 chores (5 default + 5 custom)
- 8 recent transactions

**Johnson Family Household:**
- 1 child: Olivia (£32.00, 150 points)
- 11 chores (5 default + 6 custom)
- 4 recent transactions

### Verify Success:

Run this query:
```sql
SELECT
  'households' as table_name, COUNT(*) as count FROM households
UNION ALL
SELECT 'children', COUNT(*) FROM children
UNION ALL
SELECT 'chores', COUNT(*) FROM chores
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;
```

Expected: 2 households, 3 children, 16 chores, 12 transactions

### Reference:
- Full test data guide: `/Users/Karim/kids-home-hub/TEST_DATA_LOADING_GUIDE.md`

---

## Step 3: Configure Email Authentication (10 minutes)

### What to do:
Enable email authentication so users can sign up and log in.

### How to do it:

#### A. Enable Email Provider (2 minutes)

1. Go to Supabase Dashboard: https://qojanjzukgkkrqmnyaai.supabase.co
2. Click **Authentication** > **Providers**
3. Find **Email** in the list
4. Toggle **Enable Email provider** to ON
5. Configure settings:
   - **Confirm email:** OFF (for development), ON (for production)
   - **Secure email change:** ON
   - **Magic Link:** ON
6. Click **Save**

#### B. Configure Redirect URLs (2 minutes)

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL:**
   ```
   http://localhost:5173
   ```
3. Add **Redirect URLs:**
   ```
   http://localhost:5173/**
   http://localhost:5173/auth/callback
   http://localhost:3000/**
   ```
4. Click **Save**

#### C. Customize Email Templates (5 minutes) - Optional

1. Go to **Authentication** > **Email Templates**
2. Customize these templates:
   - **Confirm Signup** - Welcome message
   - **Magic Link** - Passwordless login
   - **Reset Password** - Password reset flow
3. Update subject lines and body text to match your brand
4. Click **Save** for each template

#### D. Get Your API Keys (1 minute)

1. Go to **Settings** > **API**
2. Copy these values (you'll need them next):
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_KEY) - ⚠️ Keep secret!

### Reference:
- Full auth guide: `/Users/Karim/kids-home-hub/AUTH_CONFIGURATION_GUIDE.md`

---

## Step 4: Configure Environment Variables (5 minutes)

### What to do:
Update your application configuration with Supabase credentials.

### How to do it:

#### A. Frontend Environment Variables

File: `/Users/Karim/kids-home-hub/apps/pwa/.env`

Create or update with:
```env
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
```

**Get your keys:**
- From Step 3D above
- Or from: Supabase Dashboard > Settings > API

#### B. Backend Environment Variables

File: `/Users/Karim/kids-home-hub/apps/backend/.env`

Create or update with:
```env
SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
SUPABASE_ANON_KEY=<paste-your-anon-key-here>
SUPABASE_SERVICE_KEY=<paste-your-service-key-here>

# Other backend settings (if not already set)
NODE_ENV=development
PORT=3000
```

#### C. Verify Files Exist

Run in terminal:
```bash
# From project root
ls -la apps/pwa/.env
ls -la apps/backend/.env
```

Both files should exist. If not, create them.

### Security Note:
- ⚠️ **NEVER commit .env files to git**
- ⚠️ **service_role key** should ONLY be in backend, never in frontend
- ⚠️ Add `.env` to `.gitignore` if not already there

---

## Step 5: Test Authentication Flow (5 minutes)

### What to do:
Create a test user and verify everything works.

### How to do it:

#### A. Start Your Development Server

```bash
# Terminal 1 - Start backend
cd /Users/Karim/kids-home-hub/apps/backend
npm run dev

# Terminal 2 - Start frontend
cd /Users/Karim/kids-home-hub/apps/pwa
npm run dev
```

#### B. Test Signup

1. Open browser: http://localhost:5173
2. Navigate to signup page
3. Enter test credentials:
   - Email: `test@kidshub.dev`
   - Password: `testpassword123`
4. Submit form
5. If "Confirm email" is ON: Check email and click link
6. Should be logged in

#### C. Verify User Created

Run in Supabase SQL Editor:
```sql
-- Check user was created in both tables
SELECT
  u.id,
  u.email,
  u.email_verified,
  u.created_at
FROM users u
WHERE u.email = 'test@kidshub.dev';
```

Should return 1 row with your test user.

#### D. Test Magic Link (Optional)

1. Log out
2. Click "Sign in with Magic Link"
3. Enter email: `test@kidshub.dev`
4. Check email inbox
5. Click the magic link
6. Should be logged in automatically

---

## Step 6: Test API Endpoints (5 minutes)

### What to do:
Verify your backend API works with Supabase.

### How to do it:

#### A. Test Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T..."
}
```

#### B. Test Authenticated Endpoint

First, get your auth token from frontend (in browser console):
```javascript
// In browser console (http://localhost:5173)
const { data: { session } } = await supabase.auth.getSession()
console.log(session.access_token)
```

Then test API with token:
```bash
curl -H "Authorization: Bearer <your-access-token>" \
  http://localhost:3000/api/households
```

Expected: List of households the user has access to

#### C. Test Creating a Household

```bash
curl -X POST \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Test Household","currency":"GBP"}' \
  http://localhost:3000/api/households
```

Expected: New household created and returned as JSON

---

## Step 7: Create Your First Household (5 minutes)

### What to do:
Use the frontend UI to create a household with children and chores.

### How to do it:

1. **Log in** to the app (http://localhost:5173)
2. **Create Household:**
   - Click "Create Household" button
   - Enter name: "My Family"
   - Select currency: GBP
   - Click "Create"

3. **Add Your First Child:**
   - Click "Add Child" button
   - Enter name: "Alex"
   - Choose an avatar emoji: 👦
   - Click "Save"

4. **View Default Chores:**
   - Navigate to "Chores" section
   - Should see 5 default chores auto-created:
     - Tidy bedroom (10 points)
     - Finish homework (8 points)
     - Set/clear table (5 points)
     - Feed pet (6 points)
     - Help with laundry (7 points)

5. **Add Custom Chore:**
   - Click "Add Chore" button
   - Enter label: "Practice piano"
   - Set points: 12
   - Choose icon: 🎹
   - Category: education
   - Click "Save"

6. **Complete a Chore:**
   - Select your child (Alex)
   - Click on a chore to mark it complete
   - Verify points balance increases

7. **Add Money:**
   - Go to child's profile
   - Click "Add Money" button
   - Enter amount: £5.00
   - Enter reason: "Weekly allowance"
   - Click "Add"
   - Verify money balance increases

---

## Step 8: Verify Everything Works (5 minutes)

### Checklist:

Run through this checklist to verify your setup:

#### Database
- [x] 8 tables created
- [x] 30+ RLS policies active
- [x] Test data loaded successfully
- [x] Triggers working (user profile auto-created on signup)

#### Authentication
- [x] Email provider enabled
- [x] Can sign up new users
- [x] Confirmation emails sent (if enabled)
- [x] Can log in with email/password
- [x] Magic links work (if enabled)
- [x] User profiles created in public.users table

#### Backend API
- [x] Server starts without errors
- [x] Health check endpoint responds
- [x] Authentication middleware works
- [x] Can fetch user's households
- [x] Can create new household

#### Frontend
- [x] App loads at http://localhost:5173
- [x] Can sign up / log in
- [x] Can create household
- [x] Can add children
- [x] Can view/add chores
- [x] Can add money/points/screen time
- [x] Balances update correctly

---

## Common Issues and Solutions

### Issue: "relation 'auth.users' does not exist"
**Solution:** You're running against local Postgres, not Supabase. Ensure SUPABASE_URL points to https://qojanjzukgkkrqmnyaai.supabase.co

### Issue: No confirmation email received
**Solutions:**
1. Check spam folder
2. Disable "Confirm email" in Supabase for development
3. Check Supabase logs: Dashboard > Logs > Auth Logs

### Issue: RLS policy blocks all access
**Solutions:**
1. Verify user is authenticated
2. Check user exists in public.users table
3. Ensure user is a member of a household (household_members table)
4. Review RLS policies in MIGRATION_STATUS.md

### Issue: Frontend can't connect to backend
**Solutions:**
1. Verify backend is running on port 3000
2. Check CORS settings in backend
3. Verify SUPABASE_URL and keys in .env files
4. Check browser console for errors

### Issue: Test data not visible
**Solutions:**
1. Ensure test data script completed successfully
2. Verify user is authenticated
3. Check RLS policies allow access to test data
4. Try querying with Supabase dashboard directly

---

## Helpful Commands

### Check if services are running:
```bash
# Check backend
lsof -i :3000

# Check frontend
lsof -i :5173
```

### View backend logs:
```bash
cd /Users/Karim/kids-home-hub/apps/backend
npm run dev
# Watch the terminal for errors
```

### Reset test data:
```sql
-- In Supabase SQL Editor
DELETE FROM chore_completions;
DELETE FROM transactions;
DELETE FROM chores;
DELETE FROM children;
DELETE FROM household_members;
DELETE FROM households;
DELETE FROM users;
-- Then re-run QUICK_START.sql
```

---

## Project Structure Reference

```
/Users/Karim/kids-home-hub/
├── apps/
│   ├── backend/          # Node.js API
│   │   ├── .env          # Backend environment variables
│   │   └── src/          # API source code
│   └── pwa/              # Frontend PWA
│       ├── .env          # Frontend environment variables
│       └── src/          # Frontend source code
├── supabase/
│   ├── APPLY_MIGRATIONS.sql      # Main migration script (already applied)
│   ├── quick_check.sql           # Verification script
│   ├── migrations/               # Individual migration files
│   └── test_data/
│       └── QUICK_START.sql       # Test data script
└── Documentation files:
    ├── MIGRATION_STATUS.md            # This file
    ├── TEST_DATA_LOADING_GUIDE.md     # Test data guide
    ├── AUTH_CONFIGURATION_GUIDE.md    # Auth setup guide
    └── NEXT_STEPS.md                  # You are here
```

---

## Additional Resources

### Documentation Files
- Migration status: `/Users/Karim/kids-home-hub/MIGRATION_STATUS.md`
- Test data guide: `/Users/Karim/kids-home-hub/TEST_DATA_LOADING_GUIDE.md`
- Auth guide: `/Users/Karim/kids-home-hub/AUTH_CONFIGURATION_GUIDE.md`
- Quick test guide: `/Users/Karim/kids-home-hub/QUICK_TEST_GUIDE.md`
- Database info: `/Users/Karim/kids-home-hub/DATABASE_INFO.md`

### Migration Files
- Main script: `/Users/Karim/kids-home-hub/supabase/APPLY_MIGRATIONS.sql`
- Verification: `/Users/Karim/kids-home-hub/supabase/quick_check.sql`
- Test data: `/Users/Karim/kids-home-hub/supabase/test_data/QUICK_START.sql`
- Individual migrations: `/Users/Karim/kids-home-hub/supabase/migrations/`

### Supabase Links
- Dashboard: https://qojanjzukgkkrqmnyaai.supabase.co
- SQL Editor: https://qojanjzukgkkrqmnyaai.supabase.co/project/_/sql
- Authentication: https://qojanjzukgkkrqmnyaai.supabase.co/project/_/auth
- API Settings: https://qojanjzukgkkrqmnyaai.supabase.co/project/_/settings/api

---

## You're Done!

If you've completed all 8 steps, your Kids Home Hub application should be fully operational:

- ✅ Database migrations applied
- ✅ Test data loaded
- ✅ Authentication configured
- ✅ Environment variables set
- ✅ API working
- ✅ Frontend connected
- ✅ First household created

### What's Next?

Now you can:
1. **Build Features:** Develop new functionality
2. **Customize UI:** Update styling and branding
3. **Deploy:** Set up production environment
4. **Invite Users:** Share with family and friends

---

**Questions or Issues?**
- Review the troubleshooting sections in each guide
- Check Supabase logs and browser console for errors
- Refer to the specific guide for detailed information

**Happy building!**
