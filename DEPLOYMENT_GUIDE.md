# Deployment & CI/CD Guide

Complete guide for deploying Kids Home Hub PWA and Worker to Cloudflare infrastructure.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Manual Deployment](#manual-deployment)
4. [CI/CD Setup (GitHub Actions)](#cicd-setup)
5. [Custom Domains](#custom-domains)
6. [Environment Variables](#environment-variables)
7. [Monitoring & Observability](#monitoring)
8. [Rollback Procedures](#rollback)

---

## 1. Prerequisites

### Required Accounts

1. **Cloudflare Account** (free tier works)
   - Sign up: https://dash.cloudflare.com/sign-up
   - Verify email

2. **GitHub Account** (for CI/CD)
   - Repository: https://github.com/your-username/kids-home-hub

### Required Tools

```bash
# Node.js 18+ and pnpm
node --version  # Should be 18.0.0+
pnpm --version  # Should be 8.0.0+

# Wrangler CLI
pnpm add -g wrangler@3

# Authenticate with Cloudflare
wrangler login
```

### KV Namespace Setup

```bash
# Create KV namespaces
wrangler kv:namespace create "CHILD_SPEND"
wrangler kv:namespace create "CHILD_SPEND" --preview

# Output will show IDs like:
# id = "abc123def456..."
# preview_id = "xyz789..."

# Update apps/worker/wrangler.toml with these IDs
```

---

## 2. Local Development

### Terminal Setup

```bash
# Terminal 1: Shared package (watch mode)
cd packages/shared
pnpm build:watch

# Terminal 2: PWA dev server
cd apps/pwa
pnpm dev
# Opens http://localhost:3000

# Terminal 3: Worker dev server
cd apps/worker
pnpm dev
# Opens http://localhost:8787

# Terminal 4: Optional - run tests
pnpm test --watch
```

### Environment Variables

Create `.env` files:

**apps/pwa/.env.local**
```bash
VITE_API_URL=http://localhost:8787
```

**apps/pwa/.env.production**
```bash
VITE_API_URL=https://api.kidshub.com
```

Add to `.gitignore`:
```
.env.local
.env*.local
```

---

## 3. Manual Deployment

### Step 1: Build All Packages

```bash
# From project root
pnpm build

# This runs:
# 1. packages/shared build
# 2. apps/pwa build (outputs to apps/pwa/dist/)
# 3. apps/worker build (outputs to apps/worker/dist/worker.js)
```

### Step 2: Deploy PWA to Cloudflare Pages

```bash
cd apps/pwa

# First-time deployment
wrangler pages deploy dist --project-name kids-home-hub-pwa

# Subsequent deployments
pnpm deploy

# Output shows:
# ✅ Deployment complete!
# 🌎 https://kids-home-hub-pwa.pages.dev
```

### Step 3: Deploy Worker API

```bash
cd apps/worker

# Deploy to production
pnpm deploy

# Or manually:
wrangler deploy --env production

# Output shows:
# ✅ Published kids-home-hub-api-production
# 🌎 https://kids-home-hub-api-production.your-subdomain.workers.dev
```

### Step 4: Verify Deployments

```bash
# Test PWA
curl -I https://kids-home-hub-pwa.pages.dev

# Test Worker API
curl https://kids-home-hub-api-production.your-subdomain.workers.dev/health
# Should return: {"status":"ok","timestamp":1234567890}
```

---

## 4. CI/CD Setup (GitHub Actions)

### Step 1: Add Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Create Token → Use "Edit Cloudflare Workers" template
3. Add permissions:
   - Account > Workers Scripts > Edit
   - Account > Workers KV Storage > Edit
   - Account > Cloudflare Pages > Edit
4. Copy token

5. Add to GitHub Secrets:
   - Go to: https://github.com/your-username/kids-home-hub/settings/secrets/actions
   - New repository secret:
     - Name: `CLOUDFLARE_API_TOKEN`
     - Value: (paste token)

### Step 2: Add Account ID

```bash
# Get your Cloudflare Account ID
wrangler whoami
# Copy Account ID from output

# Add to GitHub Secrets:
# Name: CLOUDFLARE_ACCOUNT_ID
# Value: (paste account ID)
```

### Step 3: Create GitHub Actions Workflows

**.github/workflows/deploy-pwa.yml**
```yaml
name: Deploy PWA to Cloudflare Pages

on:
  push:
    branches:
      - main
    paths:
      - 'apps/pwa/**'
      - 'packages/shared/**'
      - '.github/workflows/deploy-pwa.yml'

  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.12.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared package
        run: pnpm --filter shared build

      - name: Build PWA
        run: pnpm --filter pwa build
        env:
          VITE_API_URL: https://api.kidshub.com

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/pwa/dist --project-name kids-home-hub-pwa

      - name: Comment deployment URL
        uses: actions/github-script@v7
        if: github.event_name == 'push'
        with:
          script: |
            github.rest.repos.createCommitComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              commit_sha: context.sha,
              body: '🚀 PWA deployed to https://kids-home-hub-pwa.pages.dev'
            })
```

**.github/workflows/deploy-worker.yml**
```yaml
name: Deploy Worker API

on:
  push:
    branches:
      - main
    paths:
      - 'apps/worker/**'
      - 'packages/shared/**'
      - '.github/workflows/deploy-worker.yml'

  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.12.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared package
        run: pnpm --filter shared build

      - name: Build Worker
        run: pnpm --filter worker build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: apps/worker
          command: deploy --env production
```

**.github/workflows/preview.yml** (for PRs)
```yaml
name: Deploy Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.12.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all
        run: pnpm build

      - name: Deploy PWA Preview
        uses: cloudflare/wrangler-action@v3
        id: deploy-pwa
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/pwa/dist --project-name kids-home-hub-pwa --branch preview-${{ github.event.pull_request.number }}

      - name: Comment preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🔍 Preview deployed!\n\n🌎 PWA: https://preview-${{ github.event.pull_request.number }}.kids-home-hub-pwa.pages.dev'
            })
```

### Step 4: Test CI/CD

```bash
# Make a change to PWA
echo "// test" >> apps/pwa/src/app.tsx

# Commit and push
git add .
git commit -m "test: CI/CD deployment"
git push origin main

# Check GitHub Actions:
# https://github.com/your-username/kids-home-hub/actions

# Should see:
# ✅ Deploy PWA to Cloudflare Pages
# ✅ Deploy Worker API (if worker changed)
```

---

## 5. Custom Domains

### Option 1: Cloudflare-Managed Domain

If your domain is already on Cloudflare:

#### PWA Custom Domain

1. Go to: https://dash.cloudflare.com/
2. Select your account → Pages → kids-home-hub-pwa
3. Custom domains → Set up a custom domain
4. Enter: `www.kidshub.com`
5. Cloudflare automatically creates DNS record

#### Worker Custom Domain

1. Go to Workers & Pages → kids-home-hub-api-production
2. Triggers → Custom Domains → Add Custom Domain
3. Enter: `api.kidshub.com`
4. Cloudflare creates DNS record

### Option 2: External Domain (DNS Setup)

If domain is not on Cloudflare:

#### PWA (CNAME to Pages)

```
Type: CNAME
Name: www
Value: kids-home-hub-pwa.pages.dev
TTL: Auto
```

#### Worker (CNAME to Workers)

```
Type: CNAME
Name: api
Value: kids-home-hub-api-production.your-subdomain.workers.dev
TTL: Auto
```

**Note:** Must add domain to Cloudflare for SSL/TLS certificate.

### Update API URL in PWA

**apps/pwa/.env.production**
```bash
VITE_API_URL=https://api.kidshub.com
```

Rebuild and redeploy:
```bash
pnpm build:pwa
pnpm deploy:pwa
```

---

## 6. Environment Variables

### Worker Environment Variables

**apps/worker/wrangler.toml**
```toml
[env.production]
name = "kids-home-hub-api-production"
vars = {
  ALLOWED_ORIGINS = "https://www.kidshub.com,https://kids-hub.pages.dev"
}

[env.staging]
name = "kids-home-hub-api-staging"
vars = {
  ALLOWED_ORIGINS = "https://staging.kids-hub.pages.dev"
}
```

### Secrets (Sensitive Data)

```bash
# Set secret in Worker
echo "your-secret-value" | wrangler secret put SECRET_NAME --env production

# Access in Worker code:
const secret = env.SECRET_NAME;
```

### PWA Build-Time Variables

**apps/pwa/vite.config.ts**
```typescript
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:8787'
    ),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.npm_package_version
    )
  }
});
```

---

## 7. Monitoring & Observability

### Cloudflare Analytics

#### Pages Analytics (PWA)

1. Go to: Pages → kids-home-hub-pwa → Analytics
2. View metrics:
   - Page views
   - Unique visitors
   - Bandwidth
   - Requests

#### Workers Analytics (API)

1. Go to: Workers & Pages → kids-home-hub-api-production → Metrics
2. View metrics:
   - Requests
   - Errors
   - CPU time
   - Subrequests (KV calls)

### Real User Monitoring (RUM)

Add to PWA for performance tracking:

**apps/pwa/src/utils/analytics.ts**
```typescript
export function trackPerformance() {
  if (!('PerformanceObserver' in window)) return;

  // Core Web Vitals
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);

      // Send to analytics (Cloudflare Web Analytics, Google Analytics, etc.)
      if (typeof gtag !== 'undefined') {
        gtag('event', entry.name, {
          value: Math.round(entry.startTime),
          event_category: 'Web Vitals'
        });
      }
    }
  }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
}
```

### Error Tracking with Sentry (Optional)

```bash
cd apps/pwa
pnpm add @sentry/browser
```

**apps/pwa/src/main.tsx**
```typescript
import * as Sentry from '@sentry/browser';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://your-sentry-dsn@sentry.io/project-id',
    environment: 'production',
    tracesSampleRate: 0.1
  });
}
```

### Logs

#### Worker Logs (Tail)

```bash
# Real-time logs
wrangler tail --env production

# Filter errors only
wrangler tail --env production --status error
```

#### PWA Logs (Browser Console)

Users can access via:
1. Open DevTools (F12)
2. Console tab
3. All `console.log()` statements visible

---

## 8. Rollback Procedures

### PWA Rollback (Cloudflare Pages)

#### Option 1: Cloudflare Dashboard

1. Go to: Pages → kids-home-hub-pwa → Deployments
2. Find previous working deployment
3. Click "···" → Rollback to this deployment
4. Confirm

#### Option 2: Git Revert

```bash
# Revert last commit
git revert HEAD
git push origin main

# CI/CD auto-deploys previous version
```

### Worker Rollback

#### Option 1: Wrangler Rollback

```bash
cd apps/worker

# List previous versions
wrangler deployments list --env production

# Rollback to specific version
wrangler rollback --env production --message "Rollback due to bug"
```

#### Option 2: Git Revert + Redeploy

```bash
git revert HEAD
git push origin main

# Or manually redeploy previous version
git checkout <previous-commit-hash>
cd apps/worker
pnpm build && pnpm deploy
```

### Emergency Rollback Script

**scripts/rollback.sh**
```bash
#!/bin/bash
set -e

echo "🔄 Emergency Rollback Script"
echo ""

# Get last known good commit
echo "Recent commits:"
git log --oneline -10

echo ""
read -p "Enter commit hash to rollback to: " COMMIT_HASH

# Revert to commit
git revert --no-commit $COMMIT_HASH..HEAD
git commit -m "Emergency rollback to $COMMIT_HASH"

# Build and deploy
pnpm build

echo ""
read -p "Deploy PWA? (y/n): " DEPLOY_PWA
if [ "$DEPLOY_PWA" = "y" ]; then
  pnpm deploy:pwa
  echo "✅ PWA rolled back"
fi

echo ""
read -p "Deploy Worker? (y/n): " DEPLOY_WORKER
if [ "$DEPLOY_WORKER" = "y" ]; then
  pnpm deploy:worker
  echo "✅ Worker rolled back"
fi

echo ""
echo "✅ Rollback complete!"
echo "🔍 Verify at:"
echo "   PWA: https://www.kidshub.com"
echo "   API: https://api.kidshub.com/health"
```

Make executable:
```bash
chmod +x scripts/rollback.sh
```

---

## 9. Deployment Checklist

### Pre-Deployment

- [ ] Run tests: `pnpm test`
- [ ] Type check: `pnpm type-check`
- [ ] Lint: `pnpm lint`
- [ ] Build locally: `pnpm build`
- [ ] Test PWA locally: `pnpm preview:pwa`
- [ ] Test Worker locally: `pnpm dev:worker`
- [ ] Check bundle size: `pnpm build:pwa && du -sh apps/pwa/dist`
- [ ] Update version in `package.json`
- [ ] Update CHANGELOG.md

### Deployment

- [ ] Commit changes: `git commit -m "release: v2.0.0"`
- [ ] Tag release: `git tag v2.0.0`
- [ ] Push to GitHub: `git push && git push --tags`
- [ ] Wait for CI/CD to complete
- [ ] Verify PWA deployment: https://www.kidshub.com
- [ ] Verify Worker deployment: https://api.kidshub.com/health
- [ ] Test critical paths (add transaction, chores, etc.)
- [ ] Check analytics for errors

### Post-Deployment

- [ ] Monitor error rates (first 30 minutes)
- [ ] Check performance metrics
- [ ] Verify offline functionality
- [ ] Test on mobile devices
- [ ] Create GitHub release with notes
- [ ] Notify team/users if needed
- [ ] Document any issues in issue tracker

---

## 10. Troubleshooting

### Issue: PWA not updating

**Solution:**
```javascript
// Force service worker update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
  window.location.reload();
}
```

### Issue: CORS errors

**Solution:**
Check `apps/worker/wrangler.toml`:
```toml
vars = { ALLOWED_ORIGINS = "https://www.kidshub.com" }
```

Verify Worker CORS middleware:
```typescript
app.use('/*', cors({
  origin: c.env.ALLOWED_ORIGINS.split(',')
}));
```

### Issue: KV data not persisting

**Solution:**
```bash
# Check KV namespace binding
wrangler kv:namespace list

# Check data
wrangler kv:key list --binding CHILD_SPEND --env production
wrangler kv:key get "total_adam" --binding CHILD_SPEND --env production
```

### Issue: Build fails on CI/CD

**Solution:**
```bash
# Check GitHub Actions logs
# Common issues:
# 1. Missing secrets (CLOUDFLARE_API_TOKEN)
# 2. Node version mismatch
# 3. Dependency installation failed

# Fix: Update .github/workflows/*.yml
# Ensure node-version: '18'
# Ensure pnpm version: 8.12.0
```

---

## 11. Quick Commands Reference

```bash
# Development
pnpm dev                    # Start PWA dev server
pnpm dev:worker            # Start Worker dev server
pnpm dev:all               # Start both in parallel

# Build
pnpm build                 # Build all packages
pnpm build:pwa            # Build PWA only
pnpm build:worker         # Build Worker only

# Deploy
pnpm deploy               # Deploy all
pnpm deploy:pwa          # Deploy PWA only
pnpm deploy:worker       # Deploy Worker only

# Testing
pnpm test                 # Run tests
pnpm type-check          # TypeScript check
pnpm lint                # Lint code

# Wrangler
wrangler pages deploy apps/pwa/dist --project-name kids-home-hub-pwa
wrangler deploy --env production
wrangler tail --env production
wrangler kv:key list --binding CHILD_SPEND
```

---

## Summary

This deployment guide covers:

1. **Local development** setup with hot reload
2. **Manual deployment** to Cloudflare Pages and Workers
3. **Automated CI/CD** with GitHub Actions
4. **Custom domain** configuration
5. **Environment variables** management
6. **Monitoring** and observability
7. **Rollback procedures** for emergencies

**Recommended Workflow:**
- Development: Local dev servers with HMR
- Staging: Deploy on every PR (preview deployments)
- Production: Deploy on merge to main (automated)
- Monitoring: Cloudflare Analytics + Sentry (optional)
- Rollback: Git revert or Cloudflare dashboard

**Cost:** $0/month (free tier) for personal projects!
