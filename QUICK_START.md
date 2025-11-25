# Quick Start Guide

Get the Kids Home Hub app running locally in 3 simple steps.

## Prerequisites

- Node.js 18+ and pnpm installed
- Internet connection

## Steps

### 1. Start the Dev Server

```bash
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm dev
```

The app will be available at: **http://localhost:3000**

### 2. Log In

Open http://localhost:3000 in your browser.

**Option A: Use Test Account**
1. Enter one of these test emails:
   - `parent1@example.com`
   - `kid1@example.com`
2. Click "Send Magic Link"
3. Check your email
4. Click the magic link
5. You're in!

**Option B: Create New Account**
1. Enter your email address
2. Click "Send Magic Link"
3. Check your email
4. Click the magic link
5. You're in!

### 3. Verify Everything Works

Open browser console (F12) and run:

```javascript
// Quick health check
const { supabase } = await import('/src/lib/supabase.ts');

// Check auth
const { data: { user } } = await supabase.auth.getUser();
console.log('Logged in as:', user?.email);

// Check database
const { data, error } = await supabase.from('users').select('id').limit(1);
console.log(error ? 'Database error!' : 'Database connected!');
```

You should see:
- `Logged in as: your-email@example.com`
- `Database connected!`

## That's It!

You're now running the Kids Home Hub app locally with Supabase.

## Next Steps

- Read the full [Local Testing Guide](./LOCAL_TESTING_GUIDE.md)
- Check out [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) if you have issues

## Common Commands

**Start dev server:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm dev
```

**Build for production:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm build
```

**Run tests:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm test
```

**Type check:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm type-check
```

## Need Help?

1. Check [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
2. Review browser console for errors (F12)
3. Check Supabase Dashboard: https://app.supabase.com/project/qojanjzukgkkrqmnyaai

## Test Accounts

Pre-seeded test accounts (use with magic link):

| Email | Role | Household |
|-------|------|-----------|
| parent1@example.com | Parent | Smith Family |
| parent2@example.com | Parent | Johnson Family |
| kid1@example.com | Kid | Smith Family |
| kid2@example.com | Kid | Smith Family |
| kid3@example.com | Kid | Johnson Family |

All test users can log in using the magic link authentication.
