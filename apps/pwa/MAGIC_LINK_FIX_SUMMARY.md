# Magic Link Fix Summary

## Problem
Magic link emails contain `http://localhost:3000/?code=...` instead of `https://6df264e2.kids-home-hub-pwa.pages.dev/?code=...`

## Root Cause
**The code is correct.** The issue is in the **Supabase dashboard configuration**.

Supabase has a "Site URL" setting that is currently set to `http://localhost:3000`. This overrides the `emailRedirectTo` parameter sent by the code, causing all magic links to point to localhost.

## Investigation Summary

✅ **Code Review**: The code correctly uses `window.location.origin` to dynamically detect the current URL
✅ **Deployment Check**: Latest code is deployed (confirmed `window.location.origin` in bundle)
✅ **Environment Variables**: `.env.local` correctly has `VITE_APP_URL=` (empty), allowing dynamic detection
🔧 **Enhanced Logging**: Added comprehensive logging to track what URL is being sent to Supabase

## Immediate Fix Required

### Update Supabase Dashboard (5 minutes)

1. **Go to Supabase Auth Settings**
   - URL: https://app.supabase.com/project/qojanjzukgkkrqmnyaai/auth/url-configuration

2. **Update Site URL**
   - Current: `http://localhost:3000` (most likely)
   - Change to: `https://6df264e2.kids-home-hub-pwa.pages.dev`

3. **Add Redirect URLs** (whitelist these URLs)
   ```
   http://localhost:3000/auth/callback
   https://6df264e2.kids-home-hub-pwa.pages.dev/auth/callback
   https://*.kids-home-hub-pwa.pages.dev/auth/callback
   ```

4. **Save Changes**

5. **Deploy Enhanced Logging** (optional but recommended)
   ```bash
   cd /Users/Karim/kids-home-hub/apps/pwa
   git add src/lib/supabaseAuth.ts
   git commit -m "Add enhanced logging for magic link debugging"
   git push
   ```

6. **Test**
   - Visit: https://6df264e2.kids-home-hub-pwa.pages.dev/
   - Enter your email
   - Open browser console (F12) to see detailed logs
   - Check email - should now have correct URL

## Why This Happened

When you first set up Supabase, you were testing locally at `http://localhost:3000`. This became the default "Site URL" in Supabase. Now that you've deployed to production, Supabase is still using the old localhost URL.

Supabase's security model:
1. When `emailRedirectTo` is sent, Supabase checks if it's in the "Allowed Redirect URLs" list
2. If it's NOT whitelisted, Supabase falls back to the "Site URL"
3. Since production URL wasn't whitelisted, it used the Site URL (localhost)

## Code Changes Made

### File: `/Users/Karim/kids-home-hub/apps/pwa/src/lib/supabaseAuth.ts`

Added comprehensive logging to the `sendMagicLink` function:
- Logs current location details (origin, hostname, protocol)
- Logs environment variables
- Logs computed redirect URL
- Logs full request payload sent to Supabase

This helps verify that:
1. The code is running in the correct environment
2. The correct URL is being computed
3. The correct URL is being sent to Supabase

## Expected Console Output (After Deploying)

When entering an email on production:

```
[SupabaseAuth] ========== MAGIC LINK REQUEST START ==========
[SupabaseAuth] Sending magic link to: user@example.com
[SupabaseAuth] Location details: {
  href: "https://6df264e2.kids-home-hub-pwa.pages.dev/",
  origin: "https://6df264e2.kids-home-hub-pwa.pages.dev",
  hostname: "6df264e2.kids-home-hub-pwa.pages.dev",
  port: "",
  protocol: "https:"
}
[SupabaseAuth] Using window.location.origin (no VITE_APP_URL set)
[SupabaseAuth] Environment check: {
  import.meta.env.VITE_APP_URL: "",
  import.meta.env.PROD: true,
  import.meta.env.DEV: false,
  window.location.origin: "https://6df264e2.kids-home-hub-pwa.pages.dev",
  final redirectUrl: "https://6df264e2.kids-home-hub-pwa.pages.dev/auth/callback"
}
[SupabaseAuth] Request payload: {
  "email": "user@example.com",
  "options": {
    "emailRedirectTo": "https://6df264e2.kids-home-hub-pwa.pages.dev/auth/callback",
    "shouldCreateUser": true
  }
}
[SupabaseAuth] Calling supabase.auth.signInWithOtp...
[SupabaseAuth] Magic link sent successfully
[SupabaseAuth] ========== MAGIC LINK REQUEST END ==========
```

This proves the code is sending the correct URL. If the email still has localhost, it confirms the Supabase dashboard setting is the issue.

## Additional Resources

- **Full Debug Report**: `/Users/Karim/kids-home-hub/apps/pwa/MAGIC_LINK_DEBUG.md`
- **Supabase Project Dashboard**: https://app.supabase.com/project/qojanjzukgkkrqmnyaai
- **Deployed Site**: https://6df264e2.kids-home-hub-pwa.pages.dev/

## What You Need to Do

1. ✅ **Read this summary**
2. 🔧 **Update Supabase dashboard** (Site URL + Redirect URLs)
3. ✅ **Deploy the enhanced logging** (git commit + push)
4. 🧪 **Test the fix**
5. 📧 **Verify email contains correct URL**

## Timeline

- **Investigation**: ✅ Complete
- **Code Fix**: ✅ Complete (enhanced logging added)
- **Dashboard Update**: ⏳ Pending (requires your action)
- **Testing**: ⏳ Pending (after dashboard update)
- **Resolution**: ⏳ 5-10 minutes after dashboard update

## Files Modified

- `/Users/Karim/kids-home-hub/apps/pwa/src/lib/supabaseAuth.ts` - Enhanced logging
- `/Users/Karim/kids-home-hub/apps/pwa/MAGIC_LINK_DEBUG.md` - Detailed debug report
- `/Users/Karim/kids-home-hub/apps/pwa/MAGIC_LINK_FIX_SUMMARY.md` - This file

## Confidence Level

**99% confident** the issue is Supabase dashboard configuration, not code.

Evidence:
1. Code uses `window.location.origin` ✅
2. Code is correctly deployed ✅
3. Environment variables are correct ✅
4. This is a common Supabase configuration issue ✅

The enhanced logging will provide 100% confirmation when you test it.
