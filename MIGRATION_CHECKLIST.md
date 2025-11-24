# Supabase Migration - Implementation Checklist

**Project**: Kids Home Hub
**Migration**: Cloudflare Workers + Neon → Supabase
**Date Started**: ___________
**Date Completed**: ___________

---

## Pre-Migration Checklist

- [ ] Read `SUPABASE_MIGRATION_PLAN.md` (entire document)
- [ ] Read `SUPABASE_QUICK_START.md`
- [ ] Understand current architecture (Cloudflare + Neon)
- [ ] Understand target architecture (Supabase)
- [ ] Review Supabase project dashboard
- [ ] Verify Supabase credentials are correct
- [ ] Backup current codebase (main branch intact)
- [ ] Inform team/stakeholders of migration timeline

---

## Phase 1: Foundation (Day 1) - 2-4 hours

### Step 1.1: Create Supabase Project Schema
- [ ] Open Supabase Dashboard: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai
- [ ] Go to SQL Editor
- [ ] Run migration: `20251124000000_initial_schema.sql`
- [ ] Verify tables created: Database → Tables
- [ ] Check tables exist:
  - [ ] user_profiles
  - [ ] households
  - [ ] household_members
  - [ ] children
  - [ ] chores
  - [ ] transactions
  - [ ] chore_completions

### Step 1.2: Configure RLS Policies
- [ ] Run migration: `20251124000001_rls_policies.sql`
- [ ] Verify RLS enabled: Database → Tables → (check "RLS enabled")
- [ ] Test policy: Try to query households as anonymous user (should fail)

### Step 1.3: Configure Database Triggers
- [ ] Run migration: `20251124000002_triggers.sql`
- [ ] Verify triggers created: Database → Triggers
- [ ] Test trigger: Create household → verify default chores created

### Step 1.4: Configure Supabase Auth
- [ ] Go to Authentication → Providers
- [ ] Enable "Email" provider
- [ ] Enable "Confirm email" toggle
- [ ] Go to Authentication → URL Configuration
- [ ] Add site URL: `http://localhost:3000`
- [ ] Add redirect URL: `http://localhost:3000`
- [ ] Optional: Configure custom SMTP (Resend)

### Step 1.5: Configure Environment Variables
- [ ] Create `.env.local` in `/apps/pwa/`
- [ ] Add `VITE_SUPABASE_URL`
- [ ] Add `VITE_SUPABASE_ANON_KEY`
- [ ] Verify values are correct
- [ ] Test env vars load: `console.log(import.meta.env.VITE_SUPABASE_URL)`

### Step 1.6: Create Feature Branch
- [ ] Run: `git checkout -b feature/supabase-migration`
- [ ] Push: `git push -u origin feature/supabase-migration`
- [ ] Verify main branch still intact

---

## Phase 2: Backend Migration (Days 2-3) - 4-6 hours

### Step 2.1: Install Supabase Client
- [ ] Run: `cd /Users/Karim/kids-home-hub/apps/pwa`
- [ ] Run: `pnpm add @supabase/supabase-js`
- [ ] Run: `pnpm remove @neondatabase/serverless ky`
- [ ] Verify package.json updated
- [ ] Run: `pnpm install`

### Step 2.2: Create Supabase Client
- [ ] Create file: `/apps/pwa/src/lib/supabase.ts`
- [ ] Add Supabase client initialization
- [ ] Export `supabase` client
- [ ] Add TypeScript types (Database interface)
- [ ] Test import: `import { supabase } from './lib/supabase'`

### Step 2.3: Generate TypeScript Types
- [ ] Run: `npx supabase gen types typescript --project-id qojanjzukgkkrqmnyaai > src/types/database.types.ts`
- [ ] Verify types file created
- [ ] Import types in supabase.ts
- [ ] Test type-safety in editor

### Step 2.4: Replace Auth Service
- [ ] Update `/apps/pwa/src/lib/auth.ts`
- [ ] Replace `sendMagicLink()` with Supabase version
- [ ] Replace `verifyMagicLink()` with Supabase version (not needed - automatic)
- [ ] Replace `getSession()` with Supabase version
- [ ] Replace `getCurrentUser()` with Supabase version
- [ ] Replace `isAuthenticated()` with Supabase version
- [ ] Replace `logout()` with Supabase version
- [ ] Add `onAuthStateChange()` listener
- [ ] Test auth: Send magic link → receive email → click link → logged in

### Step 2.5: Create Service Layer
- [ ] Create directory: `/apps/pwa/src/services/`
- [ ] Create `households.ts` service
  - [ ] `getHouseholds()`
  - [ ] `getHousehold(id)`
  - [ ] `createHousehold(name)`
  - [ ] `updateHousehold(id, name)`
  - [ ] `deleteHousehold(id)`
- [ ] Create `children.ts` service
  - [ ] `getChildren(householdId)`
  - [ ] `createChild(data)`
  - [ ] `updateChild(id, data)`
  - [ ] `deleteChild(id)`
- [ ] Create `chores.ts` service
  - [ ] `getChores(householdId)`
  - [ ] `createChore(data)`
  - [ ] `updateChore(id, data)`
  - [ ] `deleteChore(id)`
  - [ ] `completeChore(data)`
  - [ ] `getChoreCompletions(childId)`
- [ ] Create `transactions.ts` service
  - [ ] `createTransaction(data)`
  - [ ] `getTransactions(childId)`

---

## Phase 3: Frontend Integration (Days 4-6) - 6-8 hours

### Step 3.1: Update Authentication Components
- [ ] Update Login component
- [ ] Update Magic Link verification
- [ ] Update Auth state management
- [ ] Update Protected routes
- [ ] Test: Login flow works end-to-end

### Step 3.2: Update Household Components
- [ ] Replace API calls in `HouseholdList.tsx`
- [ ] Replace API calls in `HouseholdCard.tsx`
- [ ] Replace API calls in `CreateHousehold.tsx`
- [ ] Replace API calls in `EditHousehold.tsx`
- [ ] Replace API calls in `DeleteHousehold.tsx`
- [ ] Test: All household operations work

### Step 3.3: Update Children Components
- [ ] Replace API calls in `ChildList.tsx`
- [ ] Replace API calls in `ChildCard.tsx`
- [ ] Replace API calls in `CreateChild.tsx`
- [ ] Replace API calls in `EditChild.tsx`
- [ ] Replace API calls in `DeleteChild.tsx`
- [ ] Test: All child operations work

### Step 3.4: Update Chores Components
- [ ] Replace API calls in `ChoresList.tsx`
- [ ] Replace API calls in `ChoreCard.tsx`
- [ ] Replace API calls in `CreateChore.tsx`
- [ ] Replace API calls in `CompleteChore.tsx`
- [ ] Replace API calls in `ChoreHistory.tsx`
- [ ] Test: All chore operations work

### Step 3.5: Update Transaction Components
- [ ] Replace API calls in `MoneyBank.tsx`
- [ ] Replace API calls in `PointsBank.tsx`
- [ ] Replace API calls in `ScreenTimeBank.tsx`
- [ ] Replace API calls in `TransactionHistory.tsx`
- [ ] Test: All transaction operations work

### Step 3.6: Update Sync Mechanism
- [ ] Update `/apps/pwa/src/services/sync.ts`
- [ ] Replace custom sync endpoint with Supabase queries
- [ ] Update IndexedDB caching logic
- [ ] Optional: Add Supabase Realtime subscriptions
- [ ] Test: Multi-device sync works

### Step 3.7: Remove Old Code
- [ ] Remove `/apps/pwa/src/api/client.ts`
- [ ] Remove all references to `ky` client
- [ ] Remove all references to custom API endpoints
- [ ] Clean up unused imports
- [ ] Run: `pnpm lint --fix`

---

## Phase 4: Testing & Validation (Days 7-8) - 4-6 hours

### Step 4.1: Manual Testing - Authentication
- [ ] Send magic link email
- [ ] Receive email (check spam)
- [ ] Click magic link → redirect to app
- [ ] Session persists across page refresh
- [ ] Logout clears session
- [ ] Unauthorized access blocked
- [ ] Login on different browser → works

### Step 4.2: Manual Testing - Households
- [ ] Create household
- [ ] Verify default chores created
- [ ] List households (only see own)
- [ ] Update household name
- [ ] Delete household
- [ ] Verify children/chores deleted with household

### Step 4.3: Manual Testing - Children
- [ ] Create child
- [ ] List children in household
- [ ] Update child (name, avatar, balances)
- [ ] Delete child
- [ ] Verify transactions/completions deleted with child

### Step 4.4: Manual Testing - Chores
- [ ] List default chores
- [ ] Create custom chore
- [ ] Update chore (points, icon, category)
- [ ] Complete chore → child points updated
- [ ] View completion history
- [ ] Try to delete default chore (should fail)
- [ ] Delete custom chore (should work)

### Step 4.5: Manual Testing - Transactions
- [ ] Add money → child balance updated
- [ ] Deduct money → child balance updated
- [ ] Add points → child balance updated
- [ ] Redeem points → child balance updated
- [ ] Add screen time → child balance updated
- [ ] Deduct screen time → child balance updated
- [ ] View transaction history

### Step 4.6: Manual Testing - Multi-device Sync
- [ ] Make change on device A
- [ ] Refresh device B → sees change
- [ ] Make simultaneous changes → no conflicts

### Step 4.7: Manual Testing - Security
- [ ] Create second test user
- [ ] Try to access first user's household (should fail)
- [ ] Try to modify first user's children (should fail)
- [ ] Try to delete default chores (should fail)
- [ ] Verify RLS policies work

### Step 4.8: Automated Testing
- [ ] Update unit tests for services
- [ ] Mock Supabase client in tests
- [ ] Run: `pnpm test`
- [ ] Verify all tests pass
- [ ] Update E2E tests (Playwright)
- [ ] Run: `pnpm test:e2e`
- [ ] Verify E2E tests pass

### Step 4.9: Performance Testing
- [ ] Run: `pnpm build`
- [ ] Check bundle size (should be smaller or similar)
- [ ] Run Lighthouse audit
- [ ] Verify scores >= 95
- [ ] Test offline functionality
- [ ] Test slow network (3G throttling)

### Step 4.10: Security Audit
- [ ] Test all RLS policies in Supabase SQL Editor
- [ ] Verify auth.uid() is set correctly
- [ ] Try to bypass RLS (should fail)
- [ ] Check for SQL injection vulnerabilities
- [ ] Review auth token expiration
- [ ] Verify HTTPS only

---

## Phase 5: Deployment (Day 9) - 2-4 hours

### Step 5.1: Update Production Environment
- [ ] Go to Cloudflare Pages dashboard
- [ ] Go to Settings → Environment variables
- [ ] Add `VITE_SUPABASE_URL`
- [ ] Add `VITE_SUPABASE_ANON_KEY`
- [ ] Remove `VITE_API_URL`
- [ ] Remove `VITE_DATABASE_URL`

### Step 5.2: Configure Supabase for Production
- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Add production URL: `https://kids-home-hub.pages.dev`
- [ ] Add redirect URLs
- [ ] Optional: Configure custom SMTP
- [ ] Test email delivery in production

### Step 5.3: Deploy PWA
- [ ] Run: `pnpm build`
- [ ] Verify build succeeds
- [ ] Run: `pnpm deploy`
- [ ] Verify deployment succeeds
- [ ] Check deployment URL

### Step 5.4: Smoke Test Production
- [ ] Visit production URL
- [ ] Test authentication (request magic link)
- [ ] Check email (verify received)
- [ ] Click link → verify login works
- [ ] Create household
- [ ] Add child
- [ ] Complete chore
- [ ] Add money
- [ ] Test on mobile device
- [ ] Test multi-device sync

### Step 5.5: Monitor Production
- [ ] Check Supabase Dashboard → Logs
- [ ] Check for errors
- [ ] Monitor auth success rate
- [ ] Monitor database performance
- [ ] Check Cloudflare Pages logs
- [ ] Verify no console errors

### Step 5.6: Merge to Main
- [ ] Run final tests
- [ ] Commit all changes
- [ ] Push to feature branch
- [ ] Create pull request
- [ ] Review changes
- [ ] Merge to main: `git merge feature/supabase-migration`
- [ ] Push: `git push origin main`
- [ ] Delete feature branch (optional)

### Step 5.7: Remove Cloudflare Workers Backend
- [ ] Verify Supabase version is stable
- [ ] Delete `/apps/backend/` directory
- [ ] Remove backend dependencies from root package.json
- [ ] Update README.md (remove backend references)
- [ ] Commit: "chore: remove Cloudflare Workers backend"

---

## Post-Migration Checklist

### Verification
- [ ] All features work identically to before
- [ ] Performance is equal or better
- [ ] No data integrity issues
- [ ] No security vulnerabilities
- [ ] Multi-device sync is reliable
- [ ] Authentication is seamless

### Documentation
- [ ] Update README.md with Supabase instructions
- [ ] Update SETUP_GUIDE.md
- [ ] Document new environment variables
- [ ] Update architecture diagrams
- [ ] Add Supabase-specific docs

### Cleanup
- [ ] Remove unused dependencies
- [ ] Delete old API client code
- [ ] Clean up environment variables
- [ ] Archive Cloudflare Workers code (optional)
- [ ] Update .gitignore if needed

### Communication
- [ ] Notify users of migration (if applicable)
- [ ] Update support documentation
- [ ] Post migration summary
- [ ] Celebrate success! 🎉

---

## Rollback Plan (If Needed)

### If Migration Fails in Development
- [ ] Abandon feature branch: `git checkout main && git branch -D feature/supabase-migration`
- [ ] Continue with Cloudflare version
- [ ] Review what went wrong
- [ ] Update migration plan
- [ ] Retry later

### If Migration Fails in Production
- [ ] Go to Cloudflare Pages → Deployments
- [ ] Click "Rollback" on previous working deployment
- [ ] Restore old environment variables
- [ ] Verify Cloudflare version works
- [ ] Investigate issue
- [ ] Fix and retry

---

## Progress Tracking

### Overall Progress
- [ ] Phase 1: Foundation (___% complete)
- [ ] Phase 2: Backend Migration (___% complete)
- [ ] Phase 3: Frontend Integration (___% complete)
- [ ] Phase 4: Testing (___% complete)
- [ ] Phase 5: Deployment (___% complete)

### Time Tracking
- Phase 1: _____ hours (estimate: 2-4 hours)
- Phase 2: _____ hours (estimate: 4-6 hours)
- Phase 3: _____ hours (estimate: 6-8 hours)
- Phase 4: _____ hours (estimate: 4-6 hours)
- Phase 5: _____ hours (estimate: 2-4 hours)
- **Total**: _____ hours (estimate: 18-28 hours)

### Notes & Issues
```
Date: ___________
Issue: ___________
Resolution: ___________

Date: ___________
Issue: ___________
Resolution: ___________
```

---

## Success! 🎉

When all checkboxes are complete:
- [ ] Migration is 100% complete
- [ ] All tests passing
- [ ] Production is stable
- [ ] Users can use app normally
- [ ] Cloudflare Workers backend removed
- [ ] Documentation updated
- [ ] Team notified

**Congratulations on completing the Supabase migration!**

---

**Files to Reference**:
- `SUPABASE_MIGRATION_PLAN.md` - Comprehensive plan
- `SUPABASE_QUICK_START.md` - Quick reference
- `MIGRATION_FILES_SUMMARY.md` - Overview of all files
- `MIGRATION_CHECKLIST.md` - This file (track progress)

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Migration Plan: `SUPABASE_MIGRATION_PLAN.md`
