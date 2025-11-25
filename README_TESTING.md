# Kids Home Hub - Local Testing Setup

Everything you need to test the application locally with Supabase.

---

## Current Status: READY FOR TESTING

- Environment: Configured
- Dev Server: Running on http://localhost:3000
- Supabase: Connected
- Test Data: Available
- Documentation: Complete

---

## Quick Start (3 Steps)

### 1. Verify Dev Server is Running

The dev server should already be running. Check by opening:
http://localhost:3000

If not running, start it:
```bash
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm dev
```

### 2. Log In

Use any test account with magic link authentication:

**Test Accounts:**
- parent1@example.com
- kid1@example.com

**Steps:**
1. Enter email on login page
2. Click "Send Magic Link"
3. Check email
4. Click the link
5. You're logged in!

### 3. Verify Everything Works

Open browser console (F12) and run:

```javascript
const { supabase } = await import('/src/lib/supabase.ts');
const { data: { user } } = await supabase.auth.getUser();
console.log('Logged in as:', user?.email);

const { data } = await supabase.from('users').select('id').limit(1);
console.log('Database:', data ? 'Connected!' : 'Error!');
```

---

## Documentation

All guides are in the project root directory:

| Guide | Purpose | Time |
|-------|---------|------|
| [QUICK_START.md](./QUICK_START.md) | Get started in 3 steps | 5 min |
| [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md) | Comprehensive testing procedures | 30 min |
| [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) | Fix common issues | As needed |
| [TESTING_STATUS.md](./TESTING_STATUS.md) | Current environment status | 5 min |

---

## Configuration Details

### Environment Variables

**File:** `/Users/Karim/kids-home-hub/apps/pwa/.env.local`

**Contents:**
```env
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://kids-home-hub-api.karim-005.workers.dev
```

### Supabase Project

**URL:** https://qojanjzukgkkrqmnyaai.supabase.co
**Dashboard:** https://app.supabase.com/project/qojanjzukgkkrqmnyaai

**Status:**
- Migrations: Applied
- RLS Policies: Enabled
- Test Data: Loaded
- Auth: Configured (Magic Link)

### Test Data

Pre-loaded test accounts:

| Email | Role | Household |
|-------|------|-----------|
| parent1@example.com | Parent | Smith Family |
| parent2@example.com | Parent | Johnson Family |
| kid1@example.com | Kid | Smith Family |
| kid2@example.com | Kid | Smith Family |
| kid3@example.com | Kid | Johnson Family |

**Note:** All test accounts use magic link authentication. No passwords required.

---

## Testing Checklist

- [ ] Dev server running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Magic link emails arrive
- [ ] Login works with test accounts
- [ ] Session persists after refresh
- [ ] Can view households
- [ ] Can manage chores
- [ ] Can view transactions
- [ ] Database queries work
- [ ] No console errors
- [ ] PWA installs correctly
- [ ] Works offline (after initial load)

---

## Common Commands

**Start Dev Server:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm dev
```

**Stop Dev Server:**
Press `Ctrl+C` in terminal

**Build for Production:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm build
```

**Run Tests:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm test
```

**Type Check:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm type-check
```

---

## Quick Health Check

Run this in browser console (F12):

```javascript
async function healthCheck() {
  const { supabase } = await import('/src/lib/supabase.ts');

  // Check environment
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗');
  console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗');

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Auth:', user ? '✓ ' + user.email : '✗ Not logged in');

  // Check database
  const { error } = await supabase.from('users').select('id').limit(1);
  console.log('Database:', error ? '✗ ' + error.message : '✓ Connected');
}

healthCheck();
```

---

## Troubleshooting

### Magic Link Not Arriving?

1. Check spam folder
2. Wait 60 seconds between attempts
3. Try with Gmail/Outlook address
4. Check [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)

### Database Connection Issues?

1. Verify .env.local exists and has correct values
2. Check internet connection
3. Restart dev server
4. See [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)

### Dev Server Won't Start?

1. Check if port 3000 is in use: `lsof -ti:3000`
2. Kill existing process: `kill -9 $(lsof -ti:3000)`
3. Reinstall dependencies: `pnpm install`
4. Try again: `pnpm dev`

### Getting 401 Errors?

1. Verify you're logged in
2. Check browser console for auth errors
3. Clear localStorage and log in again
4. See [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)

---

## Project Structure

```
kids-home-hub/
├── apps/
│   ├── pwa/                    # Frontend application (Preact + Vite)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── supabase.ts      # Supabase client
│   │   │   │   ├── supabaseAuth.ts  # Auth functions
│   │   │   │   └── auth.ts          # Auth service
│   │   │   └── components/
│   │   │       └── auth/
│   │   │           └── AuthGuard.tsx
│   │   ├── .env.local          # Environment variables
│   │   └── package.json
│   └── backend/                # Backend (if applicable)
├── supabase/
│   ├── migrations/             # Database migrations
│   └── test_data/             # Test data scripts
├── QUICK_START.md             # 3-step quick start
├── LOCAL_TESTING_GUIDE.md     # Comprehensive testing guide
├── TROUBLESHOOTING_GUIDE.md   # Solutions to common issues
├── TESTING_STATUS.md          # Current environment status
└── README_TESTING.md          # This file
```

---

## Key Features to Test

### Authentication
- Magic link login
- Session persistence
- Auto token refresh
- Multi-tab sync
- Logout

### Database Operations
- Fetch users
- Fetch households
- Fetch chores
- Fetch transactions
- RLS policy enforcement
- Real-time updates

### Core Features
- View households
- Create/edit chores
- Complete chores (as kid)
- View transactions
- Manage household members
- Role-based permissions

### PWA Features
- Install as app
- Offline support
- Service worker
- Cache updates
- App manifest

---

## Performance Targets

- Initial load: < 3 seconds
- API responses: < 500ms
- Lighthouse score: > 90
- Bundle size: < 200 KB (main)
- No console errors
- Smooth interactions (60 fps)

---

## Support

**Need Help?**
1. Check [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
2. Run diagnostic script (in browser console)
3. Check browser console for errors
4. Review Supabase Dashboard logs

**Resources:**
- Supabase Docs: https://supabase.com/docs
- Supabase Status: https://status.supabase.com
- Project Dashboard: https://app.supabase.com/project/qojanjzukgkkrqmnyaai

---

## Next Steps After Testing

1. **Test on Mobile**
   - Connect to same network
   - Use computer's IP address
   - Test PWA installation

2. **Test Offline**
   - Load app while online
   - Enable airplane mode
   - Verify offline functionality

3. **Performance Testing**
   - Run Lighthouse audit
   - Check bundle sizes
   - Monitor API response times

4. **Security Testing**
   - Verify RLS policies
   - Test role permissions
   - Check token handling

5. **User Testing**
   - Test as parent
   - Test as kid
   - Test household switching

---

## Summary

Everything is ready for local testing:

- **Environment:** Configured with correct Supabase credentials
- **Dev Server:** Running on http://localhost:3000
- **Database:** Connected with test data available
- **Documentation:** Complete guides for testing and troubleshooting
- **Test Accounts:** Pre-configured for immediate testing

**Start testing now:** http://localhost:3000

For detailed instructions, see [QUICK_START.md](./QUICK_START.md) or [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md).
