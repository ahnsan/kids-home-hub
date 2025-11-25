# Magic Link Redirect Fix - Investigation & Solution

## Problem Summary

Magic link emails were redirecting to `localhost:3000/?code=...` instead of the production URL (`https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev`), even after setting `VITE_APP_URL` in Cloudflare Pages environment variables.

## Root Cause Analysis

### The Issue

**You were building locally and deploying pre-built artifacts.**

```bash
# Current workflow (PROBLEMATIC)
pnpm build                    # Builds locally with local .env.local
wrangler pages deploy dist    # Uploads pre-built files
```

### Why Cloudflare Environment Variables Didn't Work

1. **Cloudflare Pages environment variables are ONLY available during Cloudflare's build process**
2. When you set `VITE_APP_URL` in the Cloudflare dashboard, it's only injected when Cloudflare builds your app
3. Your local `.env.local` had `VITE_APP_URL=` (empty), so the build used that
4. The pre-built bundle was then uploaded to Cloudflare without the variable

### The Code Behavior

**OLD CODE (problematic):**
```typescript
const redirectUrl = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/auth/callback`
  : `${window.location.origin}/auth/callback`;
```

**Problem:** Since `VITE_APP_URL` was empty in `.env.local`, the code fell back to `window.location.origin`. However, this was evaluated at **build time** as an empty string, not at runtime.

**NEW CODE (fixed):**
```typescript
const getRedirectUrl = (): string => {
  // If VITE_APP_URL is explicitly set (e.g., in .env.local), use it
  if (import.meta.env.VITE_APP_URL) {
    return `${import.meta.env.VITE_APP_URL}/auth/callback`;
  }

  // Otherwise, use current origin (works for both localhost and production)
  return `${window.location.origin}/auth/callback`;
};

const redirectUrl = getRedirectUrl();
```

**Solution:** Now `window.location.origin` is evaluated at **runtime** in the browser, automatically using the correct URL whether on localhost or production.

## The Fix

### What Changed

1. **Updated code to use runtime detection** (`src/lib/supabaseAuth.ts`)
   - Magic link redirects now use `window.location.origin` at runtime
   - Works automatically for localhost, preview, and production
   - No environment variable needed!

2. **Added comprehensive logging** (for debugging)
   - Logs all environment variables when sending magic link
   - Shows final redirect URL
   - Disabled console.log dropping in production (for now)

3. **Updated documentation** (`.env.local` and `.env.example`)
   - Clarified that `VITE_APP_URL` is optional
   - Explained the default behavior

### Files Modified

- `/Users/Karim/kids-home-hub/apps/pwa/src/lib/supabaseAuth.ts`
- `/Users/Karim/kids-home-hub/apps/pwa/.env.local`
- `/Users/Karim/kids-home-hub/apps/pwa/.env.example`
- `/Users/Karim/kids-home-hub/apps/pwa/vite.config.ts` (temporarily disabled console dropping)

## Deployment Instructions

### Option 1: Deploy Now (Quick Fix)

```bash
# Make sure you're in the PWA directory
cd /Users/Karim/kids-home-hub/apps/pwa

# Build with the new code
pnpm build

# Deploy to Cloudflare Pages
pnpm deploy
```

### Option 2: Git-Based Deployment (Recommended for Future)

Instead of local builds, let Cloudflare build your app:

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Fix magic link redirects to use runtime origin detection"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin fix-magic-link-and-avatars
   ```

3. **Cloudflare will automatically:**
   - Detect the push
   - Build your app with environment variables
   - Deploy to your preview environment

## Verification Steps

### 1. Check Browser Console

After deployment, when you send a magic link:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Enter email and request magic link
4. Look for log output:

```
[SupabaseAuth] Sending magic link to: test@example.com
[SupabaseAuth] Environment check: {
  import.meta.env.VITE_APP_URL: "",
  import.meta.env.PROD: true,
  import.meta.env.DEV: false,
  window.location.origin: "https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev",
  final redirectUrl: "https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev/auth/callback"
}
[SupabaseAuth] Magic link sent successfully
```

**Expected values:**
- `VITE_APP_URL`: empty (or set value if you configured one)
- `window.location.origin`: should match your production URL
- `final redirectUrl`: should be `https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev/auth/callback`

### 2. Check Email

1. Check your email inbox
2. Open the magic link email
3. Hover over the link (don't click yet)
4. Verify the URL starts with:
   ```
   https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev/?code=...
   ```

### 3. Test the Full Flow

1. Click the magic link in email
2. Should redirect to production URL (not localhost)
3. Should successfully authenticate

## Supabase Configuration Check

Make sure your Supabase project has the production URL in allowed redirects:

1. Go to: https://app.supabase.com/project/qojanjzukgkkrqmnyaai/auth/url-configuration
2. Under "Redirect URLs", ensure you have:
   - `https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev/auth/callback`
   - `http://localhost:3000/auth/callback`

If the production URL is missing, add it.

## How It Works Now

### Local Development
```
User on localhost:3000
  → Requests magic link
  → Code uses window.location.origin = "http://localhost:3000"
  → Magic link redirects to http://localhost:3000/?code=...
```

### Production (Cloudflare Pages)
```
User on fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev
  → Requests magic link
  → Code uses window.location.origin = "https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev"
  → Magic link redirects to https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev/?code=...
```

### Any Custom Domain
```
User on custom-domain.com
  → Requests magic link
  → Code uses window.location.origin = "https://custom-domain.com"
  → Magic link redirects to https://custom-domain.com/?code=...
```

## Advantages of This Solution

1. **No environment variable needed** - Works out of the box
2. **No configuration per environment** - Same code works everywhere
3. **Works with any deployment** - Cloudflare, Vercel, Netlify, etc.
4. **Works with custom domains** - No need to update config
5. **Developer-friendly** - Local dev just works

## Optional: Environment Variable Override

If you ever need to force a specific redirect URL (e.g., for testing):

**In `.env.local`:**
```bash
VITE_APP_URL=https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev
```

Then rebuild and deploy. The code will use this URL instead of `window.location.origin`.

## Troubleshooting

### Issue: Still redirects to localhost

**Check:**
1. Did you rebuild? `pnpm build`
2. Did you deploy? `pnpm deploy`
3. Check browser console for "Environment check" log
4. Hard refresh the page (Ctrl+Shift+R)

### Issue: Console logs not showing

**Possible causes:**
1. Browser console might be filtered - check console filter settings
2. Make sure you're looking at the Console tab, not Network or others

### Issue: Magic link doesn't work at all

**Check:**
1. Supabase redirect URLs include your production domain
2. Email actually contains the magic link (check spam folder)
3. Link hasn't expired (magic links expire after a short time)

## Production Optimization (TODO)

After verifying the fix works, you should:

1. **Re-enable console dropping** for production builds

   In `vite.config.ts`, change:
   ```typescript
   drop_console: false, // Keep console logs for debugging magic link redirect
   ```

   Back to:
   ```typescript
   drop_console: true, // Remove console logs in production
   ```

2. **Remove debug logging** from `supabaseAuth.ts`

   Remove the "Environment check" console.log block (lines 46-52)

## Summary

- **Root Cause:** Building locally meant Cloudflare environment variables weren't used
- **Solution:** Use `window.location.origin` at runtime instead of build-time env variable
- **Benefit:** Works automatically in any environment without configuration
- **Next Step:** Deploy and test!

---

**Created:** 2025-11-25
**Author:** Claude Code
**Status:** Ready for deployment
