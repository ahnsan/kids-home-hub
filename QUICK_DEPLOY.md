# Quick Deploy Guide - Kids Home Hub PWA
## Cloudflare Pages Setup in 5 Minutes

This is a condensed version. For full details, see [CLOUDFLARE_DEPLOYMENT.md](/Users/Karim/kids-home-hub/CLOUDFLARE_DEPLOYMENT.md)

---

## Prerequisites Checklist

- [ ] Cloudflare account created (https://dash.cloudflare.com/sign-up)
- [ ] GitHub repository created and pushed
- [ ] Wrangler CLI installed: `pnpm add -g wrangler@3`
- [ ] Authenticated with Cloudflare: `wrangler login`

---

## Option 1: Deploy via Cloudflare Dashboard (Easiest)

### 1. Create Project

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Pages**
2. Click **"Create a project"** → **"Connect to Git"**
3. Authorize GitHub and select `kids-home-hub` repository

### 2. Configure Build

| Setting | Value |
|---------|-------|
| Project name | `kids-home-hub-pwa` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `cd apps/pwa && pnpm install && pnpm build` |
| Build output directory | `apps/pwa/dist` |
| Root directory | `/` |

### 3. Environment Variables (Optional)

- `NODE_VERSION`: `20`
- `PNPM_VERSION`: `8.15.0`
- `VITE_API_URL`: `https://your-worker-api.workers.dev` (if backend deployed)

### 4. Deploy

Click **"Save and Deploy"** → Wait 2-5 minutes → Done!

Your site will be live at: `https://kids-home-hub-pwa.pages.dev`

---

## Option 2: Deploy via CLI (Manual)

```bash
# Navigate to project root
cd /Users/Karim/kids-home-hub

# Build the PWA
pnpm --filter @kids-hub/pwa build

# Deploy to Cloudflare Pages
cd apps/pwa
wrangler pages deploy dist --project-name kids-home-hub-pwa
```

Done! Your site is live.

---

## Option 3: Automated CI/CD (Already Configured!)

The project already has GitHub Actions set up. Just add these secrets:

### 1. Get Cloudflare API Token

```bash
# Create token at: https://dash.cloudflare.com/profile/api-tokens
# Use "Edit Cloudflare Workers" template
# Permissions: Workers Scripts (Edit), Workers KV (Edit), Cloudflare Pages (Edit)
```

### 2. Get Cloudflare Account ID

```bash
wrangler whoami
# Copy the Account ID from output
```

### 3. Add GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/kids-home-hub/settings/secrets/actions`

Add:
- `CLOUDFLARE_API_TOKEN`: (from step 1)
- `CLOUDFLARE_ACCOUNT_ID`: (from step 2)

### 4. Push to GitHub

```bash
git push origin main
```

GitHub Actions will automatically deploy! Check: `https://github.com/YOUR_USERNAME/kids-home-hub/actions`

---

## Verification Checklist

After deployment, verify:

- [ ] Site loads: `https://kids-home-hub-pwa.pages.dev`
- [ ] No errors in browser console (F12)
- [ ] Icons display correctly
- [ ] Service worker registers (F12 → Application → Service Workers)
- [ ] App can be installed (install icon in address bar)
- [ ] Offline mode works (DevTools → Network → Offline)

---

## Troubleshooting Quick Fixes

**Build fails with "pnpm not found":**
```bash
# Add environment variable in Cloudflare Pages:
PNPM_VERSION: 8.15.0
```

**Service worker not updating:**
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
location.reload();
```

**Icons not showing:**
```bash
# Verify icons exist:
ls -la apps/pwa/public/icons/
# Should show: icon-72.png, icon-192.png, icon-512.png, etc.
```

---

## Next Steps

1. **Test on mobile devices** (iOS Safari + Android Chrome)
2. **Run Lighthouse audit** (target PWA score: 100)
3. **Add custom domain** (optional)
4. **Monitor in Cloudflare dashboard**

---

For detailed instructions, see: [CLOUDFLARE_DEPLOYMENT.md](/Users/Karim/kids-home-hub/CLOUDFLARE_DEPLOYMENT.md)
