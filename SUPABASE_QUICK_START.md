# Supabase Migration - Quick Start Guide

**For**: Kids Home Hub Supabase Migration
**Date**: 2025-11-24

---

## TL;DR - Get Started in 15 Minutes

### Step 1: Run Migrations in Supabase (5 min)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai
2. Go to **SQL Editor**
3. Run migrations in order:

```bash
# Copy and paste each file into SQL Editor and run:
1. supabase/migrations/20251124000000_initial_schema.sql
2. supabase/migrations/20251124000001_rls_policies.sql
3. supabase/migrations/20251124000002_triggers.sql
```

4. Verify tables created: Go to **Database > Tables**

### Step 2: Configure Supabase Auth (3 min)

1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. Enable **"Confirm email"** toggle
4. Go to **Authentication > URL Configuration**
5. Add redirect URL: `http://localhost:3000`

### Step 3: Create Feature Branch (1 min)

```bash
cd /Users/Karim/kids-home-hub
git checkout -b feature/supabase-migration
```

### Step 4: Install Supabase Client (2 min)

```bash
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm add @supabase/supabase-js
pnpm remove @neondatabase/serverless ky
```

### Step 5: Update Environment Variables (1 min)

```bash
cd /Users/Karim/kids-home-hub/apps/pwa

cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvamFuanp1a2dra3JxbW55YWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjQ5MjcsImV4cCI6MjA3OTUwMDkyN30.S500vXj7zBtuEGN_gG9n54ZMJCtfloNSN7kDBGTkYK8
EOF
```

### Step 6: Test Basic Setup (3 min)

1. Start dev server: `pnpm dev`
2. Open: http://localhost:3000
3. Current setup still works (Cloudflare backend)
4. Ready to start migration!

---

## What's Next?

### For Full Migration:
👉 **Read**: `/Users/Karim/kids-home-hub/SUPABASE_MIGRATION_PLAN.md`

### Quick File Overview:

1. **Migration Plan** (comprehensive): `SUPABASE_MIGRATION_PLAN.md`
   - Architecture comparison
   - Step-by-step implementation
   - Database schema & RLS
   - Authentication changes
   - Frontend integration
   - Testing & deployment

2. **SQL Migrations** (ready to run):
   - `supabase/migrations/20251124000000_initial_schema.sql`
   - `supabase/migrations/20251124000001_rls_policies.sql`
   - `supabase/migrations/20251124000002_triggers.sql`

---

## Key Supabase Info

### Project Details
- **URL**: https://qojanjzukgkkrqmnyaai.supabase.co
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Dashboard**: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai

### Important Links
- SQL Editor: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/sql
- Tables: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/editor
- Auth Users: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/auth/users
- API Docs: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/api

---

## Migration Phases (Brief)

### Phase 1: Foundation (Day 1)
- ✅ Run SQL migrations
- ✅ Configure auth
- ✅ Set up environment

### Phase 2: Backend Migration (Days 2-3)
- Install Supabase client
- Create service layer
- Replace auth service

### Phase 3: Frontend Integration (Days 4-6)
- Update all components
- Replace API calls
- Test each feature

### Phase 4: Testing (Days 7-8)
- Manual testing
- Automated tests
- Security audit

### Phase 5: Deployment (Day 9)
- Deploy to production
- Monitor and validate

---

## Quick Code Examples

### Auth (Before vs After)

```typescript
// BEFORE (Custom API)
import { sendMagicLink } from './lib/auth';
await sendMagicLink(email);

// AFTER (Supabase)
import { supabase } from './lib/supabase';
await supabase.auth.signInWithOtp({ email });
```

### Data Fetching (Before vs After)

```typescript
// BEFORE (Custom API)
const response = await api.get('v1/households').json();
const households = response.households;

// AFTER (Supabase)
const { data: households } = await supabase
  .from('households')
  .select('*');
```

### Creating Record (Before vs After)

```typescript
// BEFORE (Custom API)
await api.post('v1/children', {
  json: { householdId, name, avatar }
});

// AFTER (Supabase)
await supabase
  .from('children')
  .insert({ household_id: householdId, name, avatar });
```

---

## Common Commands

### Development
```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/supabase-migration

# Make changes, commit
git add .
git commit -m "feat: migrate to Supabase"

# Push to remote
git push origin feature/supabase-migration

# Merge to main (when complete)
git checkout main
git merge feature/supabase-migration
```

### Supabase
```bash
# Generate TypeScript types
npx supabase gen types typescript \
  --project-id qojanjzukgkkrqmnyaai \
  > src/types/database.types.ts
```

---

## Need Help?

- 📖 **Full Migration Plan**: `SUPABASE_MIGRATION_PLAN.md`
- 🔗 **Supabase Docs**: https://supabase.com/docs
- 💬 **Supabase Discord**: https://discord.supabase.com
- 🔐 **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- 🔑 **Auth Guide**: https://supabase.com/docs/guides/auth

---

## Success Checklist

After migration, verify:
- ✅ Authentication works (magic links)
- ✅ Households CRUD operations
- ✅ Children CRUD operations
- ✅ Chores create/complete/list
- ✅ Transactions create/update balances
- ✅ Multi-device sync (refresh to see changes)
- ✅ RLS prevents unauthorized access
- ✅ Performance is good
- ✅ No console errors

---

## Post-Migration Testing

After completing the migration, follow these guides:

### 1. Testing Guide
📖 **Read**: `/Users/Karim/kids-home-hub/SUPABASE_TESTING_GUIDE.md`

Complete step-by-step testing checklist including:
- Database connectivity tests
- Authentication flow tests
- CRUD operation tests
- RLS policy verification
- Performance testing
- Security testing

**Time Required**: 2-3 hours

### 2. Deployment Guide
🚀 **Read**: `/Users/Karim/kids-home-hub/SUPABASE_DEPLOYMENT.md`

Instructions for deploying to production:
- Production environment setup
- Environment variables configuration
- Cloudflare Pages deployment
- Production RLS testing
- Monitoring and rollback procedures

### 3. Final Verification
✅ **Read**: `/Users/Karim/kids-home-hub/SUPABASE_FINAL_CHECKLIST.md`

Final checklist before going live:
- All manual steps completed
- Verification queries passed
- Performance benchmarks met
- Security audit complete

---

## Quick Commands Reference

### Development
```bash
# Start dev server
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm dev

# Run tests
pnpm test

# Type check
pnpm type-check

# Build for production
pnpm build
```

### Database Operations
```bash
# Generate TypeScript types from database
npx supabase gen types typescript \
  --project-id qojanjzukgkkrqmnyaai \
  > src/types/database.types.ts

# Run a specific migration
# (in Supabase Dashboard SQL Editor)

# Verify migration status
SELECT * FROM supabase_migrations.schema_migrations;
```

### Git Workflow
```bash
# View changes
git status
git diff

# Commit changes
git add .
git commit -m "feat: complete Supabase migration Phase 6 - testing and documentation"

# Push to remote
git push origin feature/supabase-migration

# Create pull request
gh pr create --title "Supabase Migration - Phase 6 Complete" --body "See SUPABASE_FINAL_CHECKLIST.md"
```

---

**Ready to Start?** 🚀

1. ✅ Run migrations in Supabase Dashboard
2. ✅ Configure auth settings
3. ✅ Install Supabase client: `pnpm add @supabase/supabase-js`
4. ✅ Update environment variables
5. ✅ Start development server: `pnpm dev`
6. 📖 Follow testing guide: `SUPABASE_TESTING_GUIDE.md`
7. 🚀 Deploy using: `SUPABASE_DEPLOYMENT.md`
8. ✅ Complete final checklist: `SUPABASE_FINAL_CHECKLIST.md`

Good luck! 🎉
