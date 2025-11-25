# Local Testing Guide

This guide will walk you through testing the Kids Home Hub application locally with Supabase.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Access to the Supabase project at https://qojanjzukgkkrqmnyaai.supabase.co
- Migrations already applied to Supabase

## Quick Start

### 1. Environment Setup

The environment is already configured at `/Users/Karim/kids-home-hub/apps/pwa/.env.local`:

```env
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Verify the file exists and contains the correct values:
```bash
cat /Users/Karim/kids-home-hub/apps/pwa/.env.local
```

### 2. Install Dependencies

If not already installed:
```bash
cd /Users/Karim/kids-home-hub
pnpm install
```

### 3. Start the Development Server

```bash
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm dev
```

The application will be available at: **http://localhost:3000**

## Testing Authentication

### Method 1: Magic Link Authentication (Recommended)

1. Open http://localhost:3000
2. You should see the login page
3. Enter your email address
4. Click "Send Magic Link"
5. Check your email for the magic link
6. Click the link in your email
7. You'll be redirected back to the app and logged in

**Expected behavior:**
- Magic link email should arrive within 1-2 minutes
- After clicking the link, you should be redirected to http://localhost:3000
- You should see the main dashboard (not the login page)
- Your session should persist across page reloads

### Method 2: Dev Login (Development Only)

For faster testing during development:

1. Open browser console (F12)
2. Run:
```javascript
// Import the auth service
const { devLogin } = await import('/src/lib/auth.ts');

// Send magic link
await devLogin('your-email@example.com');
```
3. Check your email for the magic link
4. Click the link to log in

### Method 3: Using Test Data

The database has been seeded with test users. You can log in with any of these emails:

- parent1@example.com
- parent2@example.com
- kid1@example.com
- kid2@example.com
- kid3@example.com

Use the magic link method above with any of these emails.

## Testing Database Connectivity

### Check Supabase Connection

Open the browser console (F12) and run:

```javascript
// Test Supabase connection
const { supabase } = await import('/src/lib/supabase.ts');

// Check if we can query the database
const { data, error } = await supabase.from('users').select('id, email').limit(5);

if (error) {
  console.error('Database connection failed:', error);
} else {
  console.log('Database connection successful:', data);
}
```

**Expected output:**
```javascript
Database connection successful: [
  { id: "uuid-here", email: "parent1@example.com" },
  { id: "uuid-here", email: "parent2@example.com" },
  ...
]
```

### Check RLS (Row Level Security) Policies

After logging in, test that RLS policies are working:

```javascript
// Get current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Try to fetch households (should only return user's households)
const { data: households, error } = await supabase
  .from('households')
  .select('*');

console.log('User households:', households);
```

### Check User Profile

```javascript
// Fetch user profile
const { data: profile, error } = await supabase
  .from('users')
  .select('*')
  .eq('auth_id', (await supabase.auth.getUser()).data.user.id)
  .single();

console.log('User profile:', profile);
```

## Testing Core Features

### 1. Households

Test that you can view and interact with households:

1. Navigate to the Households page
2. You should see households for your test user
3. Try creating a new household
4. Verify it appears in the list

**Console test:**
```javascript
// Fetch households
const { data, error } = await supabase
  .from('households')
  .select('*, household_members(*)');

console.log('Households with members:', data);
```

### 2. Chores

Test chore management:

1. Navigate to a household
2. View the chores list
3. Try completing a chore (if you're a kid)
4. Try creating a chore (if you're a parent)

**Console test:**
```javascript
// Fetch chores for a household
const { data, error } = await supabase
  .from('chores')
  .select('*, chore_completions(*)')
  .eq('household_id', 'your-household-id');

console.log('Chores:', data);
```

### 3. Transactions

Test financial transactions:

1. Navigate to the Transactions page
2. View transaction history
3. Try creating a new transaction (if you're a parent)

**Console test:**
```javascript
// Fetch transactions for a household
const { data, error } = await supabase
  .from('transactions')
  .select('*, users(email)')
  .eq('household_id', 'your-household-id')
  .order('created_at', { ascending: false });

console.log('Transactions:', data);
```

## Verifying Real-time Features

Supabase supports real-time subscriptions. Test this:

```javascript
// Subscribe to new chore completions
const channel = supabase
  .channel('chore-completions')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chore_completions'
    },
    (payload) => {
      console.log('New chore completion:', payload);
    }
  )
  .subscribe();

// Later, unsubscribe
// channel.unsubscribe();
```

## Checking Auth State

### Verify Session Persistence

1. Log in to the app
2. Refresh the page (F5)
3. You should remain logged in

**Why it works:**
- Supabase stores the session in localStorage
- The app checks for an existing session on page load
- Tokens are automatically refreshed before expiry

### Test Session Across Tabs

1. Log in to the app in one tab
2. Open a new tab to http://localhost:3000
3. You should be automatically logged in

### Test Logout

1. Log out from the app
2. Verify you're redirected to the login page
3. Open a new tab - you should still be logged out
4. Check localStorage is cleared:
```javascript
console.log('Auth keys in localStorage:', Object.keys(localStorage).filter(k => k.includes('supabase')));
```

## Testing PWA Features

### Install as PWA

1. In Chrome, click the install icon in the address bar
2. Or open menu > "Install Kids Home Hub"
3. The app should open in its own window
4. Test that it works offline (after initial load)

### Service Worker

Check if the service worker is registered:

```javascript
// Check service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers:', registrations);
  });
}
```

## Performance Testing

### Check Bundle Size

```bash
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm build
```

Check the output for bundle sizes. Key files:
- Main bundle should be < 200 KB
- Vendor chunks should be code-split
- CSS should be < 50 KB

### Lighthouse Test

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Run audit for "Mobile"
4. Check scores:
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: > 90
   - PWA: Should pass all checks

## Network Inspection

### Monitor API Calls

1. Open DevTools Network tab
2. Filter by "Fetch/XHR"
3. Interact with the app
4. You should see:
   - Requests to `qojanjzukgkkrqmnyaai.supabase.co`
   - Status codes: 200 (success) or 401 (unauthorized)
   - Request headers include `Authorization: Bearer <token>`
   - Response times < 500ms (usually < 200ms)

### Check WebSocket Connection

Supabase uses WebSockets for real-time features:

1. Open DevTools Network tab
2. Filter by "WS" (WebSockets)
3. You should see a connection to Supabase Realtime
4. Status should be "101 Switching Protocols" then connected

## Testing Error Handling

### Test Network Errors

1. Open DevTools
2. Go to Network tab
3. Enable "Offline" mode
4. Try to interact with the app
5. Verify error messages are shown
6. Disable offline mode
7. App should recover automatically

### Test Auth Errors

1. Open DevTools Console
2. Clear localStorage:
```javascript
localStorage.clear();
```
3. Refresh the page
4. You should be redirected to login

### Test Invalid Data

Try to submit invalid data (e.g., empty fields, invalid numbers):
- Form validation should prevent submission
- Error messages should be clear
- No data should be sent to the server

## Success Criteria

You'll know everything is working when:

1. **Authentication**
   - Magic links arrive in email
   - Login redirects to dashboard
   - Session persists across refreshes
   - Logout works correctly

2. **Database**
   - Can fetch data from Supabase
   - RLS policies enforce security
   - Real-time updates work
   - Queries complete in < 500ms

3. **Features**
   - Can view households
   - Can manage chores
   - Can view transactions
   - Can complete chores (as kid)
   - Can create chores (as parent)

4. **Performance**
   - Page loads in < 2 seconds
   - Interactions feel instant
   - No console errors
   - Lighthouse scores > 90

## Next Steps

Once local testing is successful:

1. Test on mobile device (connect to same network, use IP address)
2. Test offline functionality
3. Test PWA installation on mobile
4. Review the Troubleshooting Guide for common issues
5. Consider setting up automated tests

## Quick Reference

**Start dev server:**
```bash
cd /Users/Karim/kids-home-hub/apps/pwa && pnpm dev
```

**Open app:**
http://localhost:3000

**Test emails:**
- parent1@example.com
- kid1@example.com

**Supabase Dashboard:**
https://app.supabase.com/project/qojanjzukgkkrqmnyaai

**Check logs:**
- Browser console: F12
- Network tab: F12 > Network
- Supabase logs: Dashboard > Logs
