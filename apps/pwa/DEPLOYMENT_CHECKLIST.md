# Deployment & Verification Checklist

## Pre-Deployment ✅

- [x] Code updated to use runtime URL detection
- [x] Build completed successfully (Nov 25 14:37:01 2025)
- [x] Console logging enabled for debugging
- [x] Documentation created (MAGIC_LINK_FIX.md)

## Deployment Steps

1. **Build** (Already done ✅)
   ```bash
   pnpm build
   ```

2. **Deploy to Cloudflare Pages**
   ```bash
   pnpm deploy
   ```
   
   This will:
   - Upload `dist/` folder to Cloudflare Pages
   - Deploy to: `fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev`
   - Generate deployment URL (note this down)

## Post-Deployment Verification

### Step 1: Check Supabase Configuration
- [ ] Go to: https://app.supabase.com/project/qojanjzukgkkrqmnyaai/auth/url-configuration
- [ ] Verify "Redirect URLs" includes:
  - [ ] `https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev/auth/callback`
  - [ ] `http://localhost:3000/auth/callback`
- [ ] If missing, add the production URL

### Step 2: Test Magic Link Flow
- [ ] Visit: https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev
- [ ] Open browser DevTools (F12) → Console tab
- [ ] Navigate to login/auth page
- [ ] Enter email address
- [ ] Click "Send Magic Link"
- [ ] Check console output:
  ```
  ✅ Should see: "[SupabaseAuth] Environment check"
  ✅ Should see: "window.location.origin: https://fix-magic-link-and-avatars..."
  ✅ Should see: "final redirectUrl: https://fix-magic-link-and-avatars...auth/callback"
  ❌ Should NOT see: "localhost:3000"
  ```

### Step 3: Verify Email Content
- [ ] Check email inbox (including spam)
- [ ] Open magic link email from Supabase
- [ ] Hover over the link (don't click yet)
- [ ] Verify URL starts with: `https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev/?code=`
- [ ] Should NOT start with: `http://localhost:3000/?code=`

### Step 4: Test Complete Authentication
- [ ] Click the magic link in email
- [ ] Browser should navigate to production URL (not localhost)
- [ ] Should see authentication success
- [ ] Check if user is logged in

### Step 5: Test Local Development (Optional)
- [ ] On your local machine, run: `pnpm dev`
- [ ] Visit: http://localhost:3000
- [ ] Request magic link
- [ ] Verify console shows: `window.location.origin: http://localhost:3000`
- [ ] Verify email redirects to: `http://localhost:3000/?code=...`

## Troubleshooting

### If magic link still redirects to localhost:

**Check browser cache:**
```
Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

**Verify deployment:**
- Check Cloudflare Pages dashboard
- Confirm latest deployment is active
- Check deployment logs for errors

**Check console output:**
- Look for "Environment check" log
- Verify `window.location.origin` value
- Verify `final redirectUrl` value

### If console logs don't appear:

- Check Console tab is selected (not Network, etc.)
- Check console filter settings (should be "All levels")
- Try clearing browser cache and hard refresh

### If authentication fails after clicking link:

**Check Supabase allowed URLs:**
- Production URL must be in Supabase redirect URLs list
- URL must match exactly (including https://)

**Check browser errors:**
- Open DevTools → Console
- Look for CORS errors or other issues

## Success Criteria

✅ Console shows correct production URL
✅ Email contains production URL (not localhost)
✅ Magic link successfully authenticates
✅ User is logged in after clicking link

## Post-Success Cleanup (After Testing)

Once everything works, you can:

1. **Re-enable console dropping** (optional, for smaller bundles)
   
   In `vite.config.ts`:
   ```typescript
   drop_console: true, // Remove console logs in production
   ```

2. **Remove debug logging** (optional)
   
   In `src/lib/supabaseAuth.ts`, remove the "Environment check" console.log

3. **Rebuild and redeploy** (if you made cleanup changes)
   ```bash
   pnpm build
   pnpm deploy
   ```

## Notes

- This fix works for ALL environments automatically (localhost, preview, production)
- No environment variables needed
- No configuration per deployment
- Works with any domain or subdomain

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Verified By:** _______________
**Status:** _______________
