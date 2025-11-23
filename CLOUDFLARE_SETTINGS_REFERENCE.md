# Cloudflare Pages Settings Reference
## Kids Home Hub PWA - Quick Configuration Guide

---

## Project Configuration

### Basic Settings

```
Project Name:           kids-home-hub-pwa
Production Branch:      main
Framework Preset:       Vite
```

---

## Build Configuration

### Build Settings

| Setting | Value | Notes |
|---------|-------|-------|
| **Build command** | `cd apps/pwa && pnpm install && pnpm build` | Monorepo requires cd to app directory |
| **Build output directory** | `apps/pwa/dist` | Relative to repository root |
| **Root directory** | `/` | Leave empty or set to `/` |
| **Install command** | (auto-detected) | Uses pnpm workspace |

### Why These Settings?

**Build Command Breakdown:**
```bash
cd apps/pwa              # Navigate to PWA directory (monorepo)
&&                       # Then
pnpm install             # Install dependencies (reads pnpm-workspace.yaml)
&&                       # Then
pnpm build               # Build PWA (runs: tsc && vite build)
```

**Alternative Build Commands:**

Option 1 (Current - Simple):
```bash
cd apps/pwa && pnpm install && pnpm build
```

Option 2 (Workspace Filter - Better):
```bash
pnpm install && pnpm --filter @kids-hub/pwa build
```

Option 3 (Explicit Shared Build - Most Reliable):
```bash
pnpm install && pnpm --filter @kids-home-hub/shared build && pnpm --filter @kids-hub/pwa build
```

---

## Environment Variables

### Production Environment

```env
NODE_VERSION=20
PNPM_VERSION=8.15.0
VITE_API_URL=https://kids-home-hub-api.workers.dev
```

### Preview Environment (Optional)

```env
NODE_VERSION=20
PNPM_VERSION=8.15.0
VITE_API_URL=https://kids-home-hub-api-staging.workers.dev
```

### How to Add Environment Variables

1. Go to: **Pages** → **kids-home-hub-pwa** → **Settings** → **Environment variables**
2. Select **Production** or **Preview**
3. Click **Add variable**
4. Enter variable name and value
5. Click **Save**

**Important:** You must redeploy after adding/changing environment variables!

---

## Deployment Settings

### Automatic Deployments

```
✅ Enabled for:
   - Production branch: main
   - Preview branches: All other branches
   - Pull Requests: Automatic preview deployments

⚙️ Build Settings:
   - Concurrent builds: 1
   - Build timeout: 20 minutes
   - Retry failed builds: Yes
```

### Branch Settings

| Branch Type | Environment | URL Pattern |
|-------------|------------|-------------|
| `main` | Production | `https://kids-home-hub-pwa.pages.dev` |
| `feature/*` | Preview | `https://feature-branch.kids-home-hub-pwa.pages.dev` |
| Pull Requests | Preview | `https://pr-123.kids-home-hub-pwa.pages.dev` |

---

## Custom Domains (Optional)

### Recommended Setup

```
Production Domain:      www.kidshomehub.com
                       ↓
                       kids-home-hub-pwa.pages.dev

Apex Domain:           kidshomehub.com
                       ↓
                       Redirect to www.kidshomehub.com
```

### DNS Configuration

**If domain is on Cloudflare:**
- Automatic DNS configuration
- Automatic SSL certificate

**If domain is external:**
```
Type:  CNAME
Name:  www
Value: kids-home-hub-pwa.pages.dev
TTL:   Auto
```

---

## Build Output

### What Gets Deployed

After build completes, Cloudflare deploys these files from `apps/pwa/dist/`:

```
dist/
├── index.html                 # Entry point
├── assets/
│   ├── index-abc123.js       # Main app bundle
│   ├── vendor-preact-def456.js
│   ├── vendor-db-ghi789.js
│   └── index-jkl012.css
├── icons/
│   ├── icon-72.png
│   ├── icon-192.png
│   ├── icon-512.png
│   └── ... (27 total icons)
├── manifest.webmanifest       # PWA manifest
├── sw.js                      # Service worker
└── simba.png                  # App mascot
```

### Build Performance

Target metrics:
- Build time: <3 minutes
- Bundle size: <150KB (gzipped)
- Total deployment size: ~500KB

---

## GitHub Integration

### Repository Settings

```
Repository:             YOUR_USERNAME/kids-home-hub
Production Branch:      main
Preview Deployments:    Enabled for all branches
PR Comments:            Enabled (shows preview URL)
Deployment Status:      Shows in PR checks
```

### Required GitHub Secrets

For automated deployments via GitHub Actions:

```
CLOUDFLARE_API_TOKEN:    (from Cloudflare API Tokens)
CLOUDFLARE_ACCOUNT_ID:   (from wrangler whoami)
```

Add at: `Settings → Secrets and variables → Actions → New repository secret`

---

## Deployment Triggers

### What Triggers a Build?

**Production Deployment:**
- Push to `main` branch
- Manual trigger in Cloudflare Dashboard
- Manual trigger via Wrangler CLI
- GitHub Actions workflow (on merge to main)

**Preview Deployment:**
- Push to any non-main branch
- Pull request creation/update
- Manual trigger for specific branch

**No Build Triggered:**
- Changes to files outside `apps/pwa/` and `packages/shared/`
- README updates
- Documentation changes
- CI/CD workflow files (unless specified)

---

## Build Optimization

### Current Optimizations

```typescript
// Already configured in vite.config.ts:

✅ Minification:        Terser (removes console.logs, debugger)
✅ Code Splitting:      3 vendor chunks (preact, db, http)
✅ Tree Shaking:        Enabled (removes unused code)
✅ Compression:         Automatic (Gzip + Brotli on Cloudflare)
✅ Source Maps:         Enabled (for debugging)
✅ Bundle Analysis:     Size limit enforced (<150KB)
```

### Bundle Size Budget

```javascript
// Enforced by CI/CD:
Total Bundle:           < 150 KB (gzipped)
Initial Load:           < 100 KB
Each Chunk:             < 500 KB (uncompressed)
```

---

## Security Headers

### Cloudflare Automatic Security

```
✅ HTTPS:               Automatic (free SSL certificate)
✅ DDoS Protection:     Enabled by default
✅ CDN:                 Global edge network
✅ HTTP/2:              Enabled
✅ HTTP/3 (QUIC):       Available
```

### Custom Headers (Optional)

Add in `public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

---

## Monitoring & Analytics

### Cloudflare Analytics (Free)

Available in Dashboard:
- Page views
- Unique visitors
- Bandwidth usage
- Request counts
- Geographic distribution
- Device/browser breakdown

### Web Vitals (Optional)

Add Cloudflare Web Analytics:
1. Dashboard → Web Analytics → Add site
2. Copy tracking code
3. Add to `apps/pwa/index.html` before `</body>`

---

## Rollback & Version Control

### Deployment History

Cloudflare keeps history of all deployments:
- Last 30 days accessible via Dashboard
- Instant rollback to any previous deployment
- No downtime during rollback

### How to Rollback

**Via Dashboard:**
1. Pages → kids-home-hub-pwa → Deployments
2. Find working deployment
3. Click "⋯" → "Rollback to this deployment"

**Via CLI:**
```bash
wrangler pages deployment list --project-name kids-home-hub-pwa
wrangler pages deployment rollback
```

---

## Cost Estimate

### Cloudflare Pages Pricing (Free Tier)

```
✅ Unlimited requests
✅ Unlimited bandwidth
✅ 500 builds/month
✅ 1 build at a time
✅ 100 custom domains
✅ Free SSL certificates
✅ Global CDN
✅ DDoS protection

Total Cost: $0/month
```

**Limits:**
- Build time: 20 minutes max per build
- Build concurrency: 1 (upgradeable to 5 on paid plan)
- Build frequency: No hard limit (reasonable use)

---

## Quick Reference Card

### Copy-Paste Settings

```
PROJECT_NAME=kids-home-hub-pwa
PRODUCTION_BRANCH=main
FRAMEWORK=Vite
BUILD_COMMAND=cd apps/pwa && pnpm install && pnpm build
BUILD_OUTPUT=apps/pwa/dist
ROOT_DIR=/
NODE_VERSION=20
PNPM_VERSION=8.15.0
```

### Essential URLs

```
Dashboard:     https://dash.cloudflare.com
Project:       https://dash.cloudflare.com/pages/kids-home-hub-pwa
Production:    https://kids-home-hub-pwa.pages.dev
Deployments:   https://dash.cloudflare.com/pages/kids-home-hub-pwa/deployments
Settings:      https://dash.cloudflare.com/pages/kids-home-hub-pwa/settings
```

### Deployment Commands

```bash
# Build locally
pnpm --filter @kids-hub/pwa build

# Deploy manually
cd apps/pwa && wrangler pages deploy dist --project-name kids-home-hub-pwa

# Check deployment status
wrangler pages deployment list --project-name kids-home-hub-pwa

# View logs
wrangler pages deployment tail --project-name kids-home-hub-pwa
```

---

## Verification After Setup

Run this checklist after configuring Cloudflare Pages:

- [ ] Project created successfully
- [ ] Build settings configured correctly
- [ ] Environment variables added (if needed)
- [ ] First deployment triggered
- [ ] Build completed successfully (check logs)
- [ ] Site accessible at `https://kids-home-hub-pwa.pages.dev`
- [ ] No errors in browser console
- [ ] Service worker registered
- [ ] PWA installable
- [ ] GitHub integration working (if using CI/CD)
- [ ] Preview deployments working (create test PR)

---

**Reference Version**: 1.0
**Last Updated**: 2025-11-23
**Project**: Kids Home Hub PWA v2.0.0
