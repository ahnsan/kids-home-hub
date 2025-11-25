# Troubleshooting Guide

This guide covers common issues you might encounter when testing the Kids Home Hub application locally with Supabase.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Database Connection Issues](#database-connection-issues)
3. [Network and CORS Issues](#network-and-cors-issues)
4. [Development Server Issues](#development-server-issues)
5. [Environment Configuration Issues](#environment-configuration-issues)
6. [PWA and Service Worker Issues](#pwa-and-service-worker-issues)
7. [Performance Issues](#performance-issues)
8. [Browser-Specific Issues](#browser-specific-issues)

---

## Authentication Issues

### Issue: Magic Link Email Not Arriving

**Symptoms:**
- Clicked "Send Magic Link" but no email received
- Waiting more than 5 minutes

**Solutions:**

1. **Check Spam/Junk Folder**
   - Magic link emails might be filtered as spam
   - Add noreply@supabase.io to your contacts

2. **Verify Email Configuration in Supabase**
   ```bash
   # Check Supabase email settings
   # Go to: https://app.supabase.com/project/qojanjzukgkkrqmnyaai/auth/templates
   ```
   - Ensure email templates are enabled
   - Check that the redirect URL is correct

3. **Check Supabase Rate Limits**
   - Supabase limits magic link requests to prevent abuse
   - Wait 60 seconds between attempts
   - Check Supabase logs for rate limit errors

4. **Use Console to Check for Errors**
   ```javascript
   // Open browser console and try:
   const { sendMagicLink } = await import('/src/lib/auth.ts');
   await sendMagicLink('your-email@example.com');
   // Check console for any error messages
   ```

5. **Verify Email Provider Accepts Supabase**
   - Some corporate email filters block automated emails
   - Try with a personal Gmail/Outlook account

### Issue: "Invalid magic link" or "Link expired"

**Symptoms:**
- Clicked magic link but got an error
- Redirected to error page

**Solutions:**

1. **Check Link Expiration**
   - Magic links expire after 1 hour by default
   - Request a new magic link

2. **Ensure Link Not Used Already**
   - Magic links are one-time use only
   - Request a new link if you already clicked it

3. **Check Redirect URL Configuration**
   ```javascript
   // In Supabase Dashboard:
   // Settings > Auth > Redirect URLs
   // Ensure http://localhost:3000 is listed
   ```

4. **Clear Browser Cache and Cookies**
   ```javascript
   // In console:
   localStorage.clear();
   sessionStorage.clear();
   // Then try the magic link again
   ```

### Issue: Session Not Persisting

**Symptoms:**
- Logged in but logged out after refresh
- Have to log in every time

**Solutions:**

1. **Check localStorage**
   ```javascript
   // In console:
   console.log(localStorage.getItem('supabase.auth.token'));
   // Should show a token object
   ```

2. **Verify Browser Allows localStorage**
   - Check if private/incognito mode is blocking storage
   - Some browsers block third-party storage
   - Try in regular browsing mode

3. **Check for JavaScript Errors**
   - Open console (F12)
   - Look for errors related to auth or storage
   - Fix any errors before the auth code runs

4. **Verify Auth Configuration**
   ```javascript
   // Check that auth is configured correctly
   const { supabase } = await import('/src/lib/supabase.ts');
   const { data } = await supabase.auth.getSession();
   console.log('Session:', data.session);
   ```

### Issue: "Not Authenticated" Errors

**Symptoms:**
- Can't access protected routes
- Getting 401 errors
- Redirected to login page

**Solutions:**

1. **Verify You're Logged In**
   ```javascript
   const { supabase } = await import('/src/lib/supabase.ts');
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

2. **Check Token Expiry**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Token expires at:', new Date(session?.expires_at * 1000));
   ```

3. **Manually Refresh Token**
   ```javascript
   const { data, error } = await supabase.auth.refreshSession();
   if (error) {
     console.error('Refresh failed:', error);
   } else {
     console.log('Token refreshed:', data.session);
   }
   ```

4. **Re-authenticate**
   - Log out completely
   - Clear localStorage
   - Log in again with magic link

---

## Database Connection Issues

### Issue: "Failed to fetch" or Connection Timeout

**Symptoms:**
- Can't load data from Supabase
- Queries timing out
- Network errors in console

**Solutions:**

1. **Verify Supabase URL and Key**
   ```bash
   cat /Users/Karim/kids-home-hub/apps/pwa/.env.local
   # Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
   ```

2. **Check Internet Connection**
   ```bash
   ping qojanjzukgkkrqmnyaai.supabase.co
   # Should get responses
   ```

3. **Test Direct Connection**
   ```javascript
   // In console:
   fetch('https://qojanjzukgkkrqmnyaai.supabase.co/rest/v1/')
     .then(r => r.text())
     .then(console.log)
     .catch(console.error);
   ```

4. **Check Firewall/VPN**
   - Corporate firewalls might block Supabase
   - VPNs might cause connection issues
   - Try disabling VPN temporarily

5. **Verify Supabase Project Status**
   - Go to https://status.supabase.com
   - Check if there are any outages
   - Check your project dashboard for issues

### Issue: RLS (Row Level Security) Blocking Queries

**Symptoms:**
- Queries return empty results
- Getting "row-level security policy" errors
- Can query in Supabase dashboard but not in app

**Solutions:**

1. **Verify You're Authenticated**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Authenticated as:', user?.email);
   // RLS policies require authentication
   ```

2. **Check RLS Policies**
   ```sql
   -- In Supabase SQL Editor:
   SELECT * FROM pg_policies WHERE tablename = 'users';
   -- Verify policies exist and are correct
   ```

3. **Test Query with Service Role Key (Admin Only)**
   ```javascript
   // WARNING: Only use service role for testing, never in production
   // This bypasses RLS to verify data exists

   // Create admin client
   const adminClient = createClient(
     'https://qojanjzukgkkrqmnyaai.supabase.co',
     'YOUR_SERVICE_ROLE_KEY' // Get from Supabase Dashboard > Settings > API
   );

   const { data } = await adminClient.from('users').select('*');
   console.log('Data exists:', data);
   ```

4. **Verify User Has Correct auth_id**
   ```javascript
   // Check if user record has correct auth_id
   const { data: { user } } = await supabase.auth.getUser();
   const { data: profile } = await supabase
     .from('users')
     .select('*')
     .eq('auth_id', user.id)
     .single();

   console.log('User auth_id:', user.id);
   console.log('Profile auth_id:', profile?.auth_id);
   // These should match
   ```

### Issue: "Invalid JWT" or Token Errors

**Symptoms:**
- Getting JWT-related errors
- Queries fail with authentication errors
- Token validation failures

**Solutions:**

1. **Check Token Format**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Access token:', session?.access_token);
   // Should be a long string starting with "eyJ"
   ```

2. **Verify Token Not Expired**
   ```javascript
   const expiresAt = session?.expires_at * 1000;
   const now = Date.now();
   console.log('Token expired?', now > expiresAt);
   ```

3. **Refresh Token Manually**
   ```javascript
   const { data, error } = await supabase.auth.refreshSession();
   if (error) {
     console.error('Refresh failed:', error);
     // May need to re-authenticate
   }
   ```

4. **Re-authenticate**
   - Log out and log back in
   - This gets a fresh token

---

## Network and CORS Issues

### Issue: CORS Errors in Console

**Symptoms:**
- "CORS policy blocked" errors
- "No 'Access-Control-Allow-Origin' header"
- Requests fail in browser but work in Postman

**Solutions:**

1. **Verify Supabase CORS Settings**
   - Supabase should allow all origins by default
   - Check: Dashboard > Settings > API > CORS

2. **Ensure Using Correct URL**
   ```javascript
   // Check that you're using the Supabase URL, not a direct IP
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   // Should be: https://qojanjzukgkkrqmnyaai.supabase.co
   ```

3. **Check for Proxy Issues**
   ```typescript
   // In vite.config.ts, check proxy configuration
   // Should NOT proxy Supabase requests
   ```

4. **Try Request from Command Line**
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" \
     https://qojanjzukgkkrqmnyaai.supabase.co/rest/v1/users
   # Should return data or 401 (not CORS error)
   ```

### Issue: Slow API Responses

**Symptoms:**
- Queries take > 2 seconds
- App feels sluggish
- Timeouts

**Solutions:**

1. **Check Network Performance**
   ```javascript
   // Measure query time
   console.time('query');
   await supabase.from('users').select('*');
   console.timeEnd('query');
   // Should be < 500ms
   ```

2. **Optimize Queries**
   ```javascript
   // Bad: Fetching too much data
   const { data } = await supabase.from('chores').select('*');

   // Good: Select only needed columns and filter
   const { data } = await supabase
     .from('chores')
     .select('id, title, points')
     .eq('household_id', householdId)
     .limit(20);
   ```

3. **Check Database Performance**
   - Go to Supabase Dashboard > Database > Logs
   - Look for slow queries
   - Consider adding indexes

4. **Enable Query Caching**
   ```javascript
   // Use React Query or similar for caching
   // Avoid re-fetching the same data
   ```

---

## Development Server Issues

### Issue: Dev Server Won't Start

**Symptoms:**
- `pnpm dev` fails
- Port 3000 already in use
- Build errors

**Solutions:**

1. **Check Port 3000**
   ```bash
   # Find process using port 3000
   lsof -ti:3000

   # Kill it if needed
   kill -9 $(lsof -ti:3000)

   # Or use different port
   PORT=3001 pnpm dev
   ```

2. **Clear Node Modules**
   ```bash
   cd /Users/Karim/kids-home-hub/apps/pwa
   rm -rf node_modules
   pnpm install
   ```

3. **Check for TypeScript Errors**
   ```bash
   pnpm type-check
   # Fix any errors shown
   ```

4. **Verify Dependencies**
   ```bash
   # Check that @supabase/supabase-js is installed
   pnpm list @supabase/supabase-js
   # Should show version 2.84.0 or higher
   ```

### Issue: Hot Module Replacement (HMR) Not Working

**Symptoms:**
- Changes don't reflect in browser
- Have to manually refresh
- Vite not detecting file changes

**Solutions:**

1. **Check File Watching**
   ```bash
   # On macOS, increase file watch limit
   echo kern.maxfiles=65536 | sudo tee -a /etc/sysctl.conf
   echo kern.maxfilesperproc=65536 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -w kern.maxfiles=65536
   sudo sysctl -w kern.maxfilesperproc=65536
   ```

2. **Restart Dev Server**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   pnpm dev
   ```

3. **Check for Syntax Errors**
   - HMR fails if there are syntax errors
   - Check console for errors

### Issue: Build Fails

**Symptoms:**
- `pnpm build` fails
- TypeScript errors
- Missing dependencies

**Solutions:**

1. **Check TypeScript Errors**
   ```bash
   pnpm type-check
   # Fix all errors
   ```

2. **Verify Environment Variables**
   ```bash
   # .env.local must exist for build
   cat /Users/Karim/kids-home-hub/apps/pwa/.env.local
   ```

3. **Clear Build Cache**
   ```bash
   cd /Users/Karim/kids-home-hub/apps/pwa
   rm -rf dist .vite
   pnpm build
   ```

4. **Check Disk Space**
   ```bash
   df -h
   # Ensure sufficient space available
   ```

---

## Environment Configuration Issues

### Issue: Environment Variables Not Loading

**Symptoms:**
- `import.meta.env.VITE_SUPABASE_URL` is undefined
- App shows "Missing environment variable" error

**Solutions:**

1. **Verify .env.local Exists**
   ```bash
   ls -la /Users/Karim/kids-home-hub/apps/pwa/.env.local
   # File should exist
   ```

2. **Check Variable Names**
   - Must start with `VITE_` to be exposed to client
   - Case-sensitive
   ```env
   # Correct
   VITE_SUPABASE_URL=https://...

   # Wrong (missing VITE_ prefix)
   SUPABASE_URL=https://...
   ```

3. **Restart Dev Server**
   - Environment variables are loaded at startup
   - Changes require restart
   ```bash
   # Stop server (Ctrl+C)
   pnpm dev
   ```

4. **Verify Variable Access**
   ```javascript
   // In console:
   console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
   // Should show values, not undefined
   ```

### Issue: Wrong Supabase Project

**Symptoms:**
- Data doesn't match what you expect
- Can't log in with test users
- RLS errors

**Solutions:**

1. **Verify Project URL**
   ```bash
   cat /Users/Karim/kids-home-hub/apps/pwa/.env.local | grep VITE_SUPABASE_URL
   # Should be: https://qojanjzukgkkrqmnyaai.supabase.co
   ```

2. **Check Supabase Dashboard**
   - Go to https://app.supabase.com
   - Ensure you're in the correct project
   - Project reference should be: qojanjzukgkkrqmnyaai

3. **Verify API Keys Match**
   - Dashboard > Settings > API
   - Copy anon key
   - Compare with .env.local

---

## PWA and Service Worker Issues

### Issue: Service Worker Not Registering

**Symptoms:**
- PWA install prompt doesn't appear
- Offline mode doesn't work
- Cache not working

**Solutions:**

1. **Check Service Worker Registration**
   ```javascript
   // In console:
   navigator.serviceWorker.getRegistrations().then(regs => {
     console.log('Service workers:', regs);
   });
   // Should show at least one registration
   ```

2. **Verify HTTPS or Localhost**
   - Service workers require HTTPS
   - Exception: localhost is allowed
   - IP addresses (192.168.x.x) require HTTPS

3. **Clear Service Worker Cache**
   ```javascript
   // Unregister all service workers
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.unregister());
   });

   // Clear caches
   caches.keys().then(keys => {
     keys.forEach(key => caches.delete(key));
   });

   // Reload page
   location.reload();
   ```

4. **Check Console for Errors**
   - Service worker errors appear in console
   - Look for registration failures

### Issue: Stale Cache / Old Code Running

**Symptoms:**
- Changes not appearing
- Old version of app running
- Unexpected behavior

**Solutions:**

1. **Hard Refresh**
   - Chrome/Firefox: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Bypasses cache

2. **Clear All Caches**
   ```javascript
   // In console:
   caches.keys().then(keys => {
     return Promise.all(keys.map(key => caches.delete(key)));
   });
   location.reload();
   ```

3. **Unregister and Reload**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => {
     return Promise.all(regs.map(reg => reg.unregister()));
   }).then(() => {
     location.reload();
   });
   ```

4. **Dev Tools: Bypass Service Worker**
   - F12 > Application > Service Workers
   - Check "Bypass for network"
   - Or "Unregister" the worker

---

## Performance Issues

### Issue: Slow Page Loads

**Symptoms:**
- Initial load > 3 seconds
- White screen for a long time
- Slow time to interactive

**Solutions:**

1. **Check Bundle Size**
   ```bash
   pnpm build
   # Check output for bundle sizes
   # Main bundle should be < 200 KB
   ```

2. **Use Production Build**
   ```bash
   pnpm build
   pnpm preview
   # Test on http://localhost:4173
   # Production builds are much faster
   ```

3. **Check Network Throttling**
   - F12 > Network tab
   - Ensure not throttled to "Slow 3G"
   - Set to "No throttling" for testing

4. **Optimize Images**
   - Compress images
   - Use appropriate formats (WebP)
   - Lazy load images

### Issue: Memory Leaks

**Symptoms:**
- App gets slower over time
- Browser tab uses lots of RAM
- Console warnings about memory

**Solutions:**

1. **Check for Unsubscribed Listeners**
   ```javascript
   // Always unsubscribe from auth listeners
   const unsubscribe = supabase.auth.onAuthStateChange(() => {});

   // In cleanup:
   unsubscribe();
   ```

2. **Clear Intervals/Timeouts**
   ```javascript
   // In useEffect cleanup or componentWillUnmount
   return () => {
     clearInterval(intervalId);
     clearTimeout(timeoutId);
   };
   ```

3. **Use Chrome DevTools Memory Profiler**
   - F12 > Memory tab
   - Take heap snapshot
   - Look for detached DOM nodes
   - Check for growing arrays/objects

---

## Browser-Specific Issues

### Issue: Safari Issues

**Symptoms:**
- Works in Chrome but not Safari
- localStorage issues
- PWA not installing

**Solutions:**

1. **Enable Cross-Site Tracking**
   - Safari > Preferences > Privacy
   - Uncheck "Prevent cross-site tracking" (for testing)

2. **Clear Safari Cache**
   - Develop menu > Empty Caches
   - Or Safari > Clear History

3. **Check Console for Safari-Specific Errors**
   - Safari has stricter security policies
   - Some APIs behave differently

### Issue: Firefox Issues

**Symptoms:**
- Works in Chrome but not Firefox
- IndexedDB issues
- PWA issues

**Solutions:**

1. **Check IndexedDB Permissions**
   - Firefox might block IndexedDB in private mode
   - Test in regular browsing mode

2. **Clear Firefox Storage**
   - F12 > Storage tab
   - Right-click > "Delete All"

3. **Check about:config Settings**
   - dom.serviceWorkers.enabled should be true
   - dom.indexedDB.enabled should be true

---

## Quick Diagnostics Script

Run this in the browser console for a quick health check:

```javascript
async function diagnose() {
  console.log('=== Supabase Connection Diagnostic ===\n');

  // 1. Check environment variables
  console.log('1. Environment Variables:');
  console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  console.log('');

  // 2. Check Supabase client
  const { supabase } = await import('/src/lib/supabase.ts');
  console.log('2. Supabase Client: Initialized');
  console.log('');

  // 3. Check authentication
  console.log('3. Authentication:');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('  Authenticated:', !!user);
  if (user) {
    console.log('  User ID:', user.id);
    console.log('  Email:', user.email);
  }
  console.log('');

  // 4. Check session
  console.log('4. Session:');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('  Has session:', !!session);
  if (session) {
    const expiresAt = new Date(session.expires_at * 1000);
    console.log('  Expires at:', expiresAt.toLocaleString());
    console.log('  Expired:', Date.now() > session.expires_at * 1000);
  }
  console.log('');

  // 5. Test database connection
  console.log('5. Database Connection:');
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('users').select('id').limit(1);
    const duration = Date.now() - start;

    if (error) {
      console.log('  Status: Failed');
      console.log('  Error:', error.message);
    } else {
      console.log('  Status: Connected');
      console.log('  Response time:', duration + 'ms');
    }
  } catch (error) {
    console.log('  Status: Error');
    console.log('  Error:', error.message);
  }
  console.log('');

  // 6. Check localStorage
  console.log('6. LocalStorage:');
  const authKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
  console.log('  Auth keys found:', authKeys.length);
  console.log('');

  // 7. Check service worker
  console.log('7. Service Worker:');
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    console.log('  Registered:', regs.length > 0);
    console.log('  Count:', regs.length);
  } else {
    console.log('  Not supported');
  }
  console.log('');

  console.log('=== Diagnostic Complete ===');
}

// Run diagnostic
diagnose();
```

---

## Getting Help

If you're still experiencing issues:

1. **Check Supabase Status**
   - https://status.supabase.com

2. **Review Supabase Logs**
   - Dashboard > Logs
   - Filter by authentication or database errors

3. **Check Application Logs**
   - Browser console (F12)
   - Network tab for failed requests
   - Look for red errors

4. **Enable Verbose Logging**
   ```javascript
   // In src/lib/supabase.ts, add:
   const supabase = createClient(url, key, {
     auth: {
       debug: true, // Enable debug logging
     }
   });
   ```

5. **Minimal Reproduction**
   - Create a minimal test case
   - Test with curl or Postman
   - Isolate the issue

## Quick Reference

**Clear everything and start fresh:**
```javascript
// In console:
localStorage.clear();
sessionStorage.clear();
await navigator.serviceWorker.getRegistrations().then(regs =>
  Promise.all(regs.map(reg => reg.unregister()))
);
await caches.keys().then(keys =>
  Promise.all(keys.map(key => caches.delete(key)))
);
location.reload();
```

**Check Supabase connection:**
```javascript
const { supabase } = await import('/src/lib/supabase.ts');
const { data, error } = await supabase.from('users').select('*').limit(1);
console.log(error ? 'Error: ' + error.message : 'Connected!');
```

**Re-authenticate:**
```javascript
const { sendMagicLink } = await import('/src/lib/auth.ts');
await sendMagicLink('your-email@example.com');
// Check email and click link
```
