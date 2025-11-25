# Quick Fix Guide - Magic Link & Avatar Issues

**Status:** ✅ Code Fixed & Deployed | ⚠️ Env Var Configuration Required

---

## TL;DR

Both issues are **FIXED in code** and **DEPLOYED**, but magic link fix needs **one manual step** in Cloudflare dashboard.

### Deployment URLs
- **Latest:** https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev
- **Production:** https://kids-home-hub-pwa.pages.dev

---

## Issue 1: Magic Link Redirects to localhost

### What Was Fixed
Changed redirect URL from hardcoded `window.location.origin` to use environment variable `VITE_APP_URL`.

### Action Required (5 minutes)

1. **Go to Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   → Pages → kids-home-hub-pwa → Settings → Environment variables
   ```

2. **Add Preview Environment Variable**
   - Click "Add variable" under **Preview**
   - Name: `VITE_APP_URL`
   - Value: `https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev`
   - Click "Save"

3. **Add Production Environment Variable**
   - Click "Add variable" under **Production**
   - Name: `VITE_APP_URL`
   - Value: `https://kids-home-hub-pwa.pages.dev`
   - Click "Save"

4. **Redeploy** (to pick up env vars)
   ```bash
   cd /Users/Karim/kids-home-hub/apps/pwa
   pnpm wrangler pages deploy dist --project-name=kids-home-hub-pwa --branch=fix-magic-link-and-avatars
   ```

### How to Verify
1. Visit the deployment URL
2. Request magic link
3. Check browser console: Should log `[SupabaseAuth] Redirect URL: https://...pages.dev/auth/callback`
4. Check email link: Should redirect to `.pages.dev` (not `localhost:3000`)

---

## Issue 2: Broken Avatar Images

### What Was Fixed
Replaced `<img>` tag with `Avatar` component that properly renders emoji strings.

### Action Required
**None!** This fix works immediately. ✅

### How to Verify
1. Visit: https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev
2. Complete onboarding
3. Add children with emoji avatars
4. Check dashboard: Emojis should display (not broken images)

---

## Files Changed

```
src/lib/supabaseAuth.ts          # Magic link redirect fix
src/components/dashboard/ChildCard.tsx  # Avatar rendering fix
.env.local                       # Added VITE_APP_URL (empty for dev)
.env.example                     # Added VITE_APP_URL docs
```

---

## Testing Checklist

- [x] Build passes without errors
- [x] Deployed to Cloudflare Pages
- [ ] Set VITE_APP_URL in Cloudflare dashboard (Preview)
- [ ] Set VITE_APP_URL in Cloudflare dashboard (Production)
- [ ] Redeploy after setting env vars
- [ ] Test magic link redirects to production (not localhost)
- [ ] Test avatars display correctly (works now)

---

## Troubleshooting

### Magic link still uses localhost
→ Set `VITE_APP_URL` in Cloudflare dashboard, then redeploy

### Avatars still broken
→ Hard refresh browser (Cmd+Shift+R)

### Console shows "Redirect URL: undefined"
→ Env var not set or not redeployed after setting

---

## Quick Commands

```bash
# Rebuild
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm build

# Deploy to preview
pnpm wrangler pages deploy dist --project-name=kids-home-hub-pwa --branch=fix-magic-link-and-avatars

# Deploy to production
pnpm wrangler pages deploy dist --project-name=kids-home-hub-pwa --branch=main

# Check deployments
pnpm wrangler pages deployment list --project-name=kids-home-hub-pwa
```

---

## Environment Variables Reference

| Env | Variable | Value |
|-----|----------|-------|
| **Preview** | `VITE_APP_URL` | `https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev` |
| **Production** | `VITE_APP_URL` | `https://kids-home-hub-pwa.pages.dev` |
| **Local Dev** | `VITE_APP_URL` | (empty - uses `window.location.origin`) |

---

**Last Updated:** 2025-11-25
**Deployment:** https://fix-magic-link-and-avatars.kids-home-hub-pwa.pages.dev
