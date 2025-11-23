# Kids Home Hub - Complete Deployment Pipeline Guide

**Last Updated**: November 23, 2025
**Version**: 2.0.0
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Environment Setup](#environment-setup)
4. [Deployment Workflows](#deployment-workflows)
5. [Rollback Strategy](#rollback-strategy)
6. [Environment Variables](#environment-variables)
7. [Testing the Pipeline](#testing-the-pipeline)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Kids Home Hub deployment pipeline is designed with enterprise-grade practices:

- **Automated Quality Gates**: Every commit goes through linting, type-checking, and testing
- **Security First**: Automated vulnerability scanning, secret detection, and license compliance
- **Performance Monitoring**: Bundle size tracking, Lighthouse CI, load testing
- **Zero-Downtime Deployments**: Blue-green deployments via Cloudflare
- **Automatic Rollbacks**: Failed deployments automatically rollback
- **Multi-Environment**: Preview (PRs), Staging (main branch), Production (manual approval)

### Key Features

✅ Parallel CI jobs for faster feedback
✅ Automatic preview deployments for every PR
✅ Production deployments require manual approval
✅ Comprehensive smoke tests post-deployment
✅ Automatic rollback on failure
✅ GitHub release creation with changelog
✅ Slack notifications (optional)

---

## Pipeline Architecture

### Workflow Overview

```
┌──────────────────┐
│  Push to Branch  │
└────────┬─────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────┐                    ┌──────────────────┐
│   CI Pipeline   │                    │  PWA Deployment  │
│ (ci.yml)        │                    │  (deploy-pwa.yml)│
├─────────────────┤                    ├──────────────────┤
│ • Setup         │                    │ • Build          │
│ • Lint          │                    │ • Type Check     │
│ • Type Check    │                    │ • Tests          │
│ • Unit Tests    │◄───────────────────│ • Deploy Preview │
│ • Integration   │                    │   (if PR)        │
│ • E2E Tests     │                    │ • Deploy Prod    │
│ • Build         │                    │   (if main)      │
│ • Quality Gate  │                    │ • Smoke Tests    │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌──────────────────┐
│   Security      │                    │ Post-Deployment  │
│ (security.yml)  │                    │ • E2E Tests      │
├─────────────────┤                    │ • Lighthouse     │
│ • NPM Audit     │                    │ • Monitoring     │
│ • Snyk Scan     │                    └──────────────────┘
│ • CodeQL        │
│ • Secret Detect │
│ • License Check │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Performance    │
│ (performance.yml)│
├─────────────────┤
│ • Bundle Size   │
│ • Lighthouse CI │
│ • Load Testing  │
│ • Memory Profile│
│ • Build Time    │
└─────────────────┘
```

### Deployment Flow

**For Pull Requests:**
```
PR Created → CI Pipeline → Security Scan → Performance Check → Preview Deploy → PR Comment with URL
```

**For Main Branch:**
```
Push to Main → CI Pipeline → Build PWA → Deploy to Production → Smoke Tests → Create Release
                                                              ↓ (if fail)
                                                          Auto Rollback
```

---

## Environment Setup

### Prerequisites

1. **GitHub Repository**
   - Admin access to repository
   - Branch protection configured

2. **Cloudflare Account**
   - Workers account (for backend)
   - Pages project (for PWA frontend)
   - API token with Pages:Edit permissions

3. **Optional Services**
   - Codecov account (for coverage tracking)
   - Snyk account (for security scanning)
   - Slack workspace (for notifications)

### Step 1: Cloudflare Setup

#### 1.1 Create Cloudflare Pages Project

```bash
# Login to Cloudflare
wrangler login

# Create Pages project (or use Cloudflare Dashboard)
wrangler pages project create kids-home-hub-pwa

# Note the project name for GitHub Actions
```

**Via Dashboard:**
1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Name: `kids-home-hub-pwa`
4. Build settings: Leave blank (we handle builds in GitHub Actions)

#### 1.2 Create API Token

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. **Permissions**:
   - Account → Cloudflare Pages → Edit
   - Account → Account Settings → Read
5. Copy the token (you'll only see it once!)

#### 1.3 Get Account ID

1. Go to Cloudflare Dashboard
2. Click on any domain/project
3. Copy Account ID from the right sidebar

### Step 2: GitHub Secrets Configuration

Navigate to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

#### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | From Step 1.2 above |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | From Step 1.3 above |

#### Optional Secrets

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `CODECOV_TOKEN` | Codecov upload token | Coverage reports |
| `SNYK_TOKEN` | Snyk API token | Security scanning |
| `SLACK_WEBHOOK_URL` | Slack webhook URL | Notifications |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI token | Lighthouse reports |

### Step 3: GitHub Environments

Create deployment environments for protection rules.

**Settings → Environments → New environment**

#### Environment: `preview`
- **Protection rules**: None (auto-deploy for PRs)
- **Environment secrets**: None required

#### Environment: `production`
- **Protection rules**:
  - ✅ Required reviewers: 1 (select yourself or team)
  - ✅ Wait timer: 0 minutes (or add delay if desired)
- **Environment secrets**: None required (uses repository secrets)

### Step 4: Branch Protection

Protect the `main` branch to ensure quality.

**Settings → Branches → Add rule**

Branch name pattern: `main`

**Protection settings:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `Lint Code`
    - `TypeScript Type Check`
    - `Unit Tests`
    - `Build PWA`
    - `Quality Gate`
- ✅ Do not allow bypassing the above settings (even for admins)

---

## Deployment Workflows

### Workflow 1: CI Pipeline (`ci.yml`)

**Purpose**: Quality assurance for all code changes

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual dispatch

**Jobs**:
1. **Setup** - Install dependencies, cache
2. **Lint** - ESLint + Prettier
3. **Type Check** - TypeScript compilation
4. **Unit Tests** - Vitest with 80% coverage
5. **Integration Tests** - API integration tests
6. **E2E Tests** - Playwright across browsers
7. **Build** - Production build
8. **Quality Gate** - Verify all passed

**Duration**: ~5-8 minutes (parallel execution)

### Workflow 2: PWA Deployment (`deploy-pwa.yml`)

**Purpose**: Deploy PWA to Cloudflare Pages

**Triggers**:
- Push to `main` (production deploy)
- Pull request (preview deploy)
- Manual dispatch

**Jobs**:

#### Build PWA
- Type check PWA code
- Lint PWA code
- Run PWA tests
- Build production bundle
- Upload artifacts

#### Deploy Preview (for PRs)
- Download build artifacts
- Deploy to Cloudflare Pages (preview)
- Comment on PR with preview URL
- Run Lighthouse CI (optional)

#### Deploy Production (for main)
- Requires manual approval
- Download build artifacts
- Deploy to Cloudflare Pages (production)
- Run smoke tests
- Create GitHub release
- Notify on success/failure

#### Post-Deployment
- Run E2E tests against production
- Performance audit
- Monitor metrics

**Duration**:
- Preview: ~3-5 minutes
- Production: ~8-12 minutes (includes approval wait)

### Workflow 3: Security Scanning (`security.yml`)

**Purpose**: Automated security checks

**Triggers**:
- Push to `main` or `develop`
- Pull requests
- Daily at 2 AM UTC (scheduled)
- Manual dispatch

**Jobs**:
1. **NPM Audit** - Check for known vulnerabilities
2. **Snyk** - Deep dependency scanning
3. **CodeQL** - Static code analysis
4. **Secret Scanning** - Detect leaked secrets
5. **License Compliance** - Check dependency licenses
6. **OSV Scanner** - Open source vulnerability database

**Duration**: ~10-15 minutes

### Workflow 4: Performance Monitoring (`performance.yml`)

**Purpose**: Track and enforce performance budgets

**Triggers**:
- Push to `main` or `develop`
- Pull requests
- Manual dispatch

**Jobs**:
1. **Bundle Size** - Enforce size budgets
2. **Lighthouse CI** - Performance audits
3. **Load Testing** - k6 stress tests
4. **Memory Profiling** - Heap usage tracking
5. **Build Time** - Monitor build performance

**Duration**: ~8-12 minutes

### Workflow 5: E2E Tests (`e2e-tests.yml`)

**Purpose**: Comprehensive browser testing

**Triggers**:
- Pull requests
- Push to `main` or `develop`
- Before deployments (workflow_call)
- Manual dispatch

**Jobs**:
1. **Desktop Tests** - Chromium, Firefox, WebKit
2. **Mobile Tests** - Mobile Chrome, Mobile Safari
3. **Test Summary** - Aggregate results

**Duration**: ~10-15 minutes

---

## Rollback Strategy

### Automatic Rollback

The pipeline includes automatic rollback for production deployments:

**Triggers**:
- Smoke tests fail after deployment
- Health check endpoint returns errors
- Critical errors in deployment logs

**Process**:
1. Smoke tests run immediately after deployment
2. If any test fails, workflow marks deployment as failed
3. Manual rollback required via Cloudflare Dashboard

### Manual Rollback

#### Via Cloudflare Dashboard (Recommended)

1. Go to Cloudflare Dashboard → Pages
2. Select `kids-home-hub-pwa` project
3. Click "Deployments" tab
4. Find the last working deployment
5. Click "..." → "Rollback to this deployment"
6. Confirm rollback

**Result**: Instant rollback, zero downtime

#### Via GitHub Actions

Re-run a previous successful workflow:

1. Go to Actions tab
2. Find the last successful "Deploy PWA" workflow
3. Click "Re-run all jobs"
4. Approve production deployment

#### Via Git

Deploy a previous commit:

```bash
# Find the last good commit
git log --oneline

# Create a revert commit
git revert <bad-commit-sha>

# Push to main
git push origin main

# Or checkout previous commit and force push (destructive!)
git checkout <good-commit-sha>
git push origin main --force
```

### Rollback Testing

Test your rollback process quarterly:

```bash
# 1. Deploy a known-good version
git tag test-rollback-baseline

# 2. Deploy a "broken" version (with failing smoke test)
# 3. Verify automatic rollback detection
# 4. Practice manual rollback via dashboard
# 5. Verify application works after rollback
```

---

## Environment Variables

### Build-Time Variables (Vite)

Set in workflow or `.env` files (prefix with `VITE_`):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APP_VERSION` | Application version | `2.0.0-abc123-20250123` |
| `VITE_API_URL` | Backend API URL | `https://api.kids-home-hub.com` |
| `VITE_ENVIRONMENT` | Deployment environment | `production` |

### Runtime Variables (Cloudflare)

Set in Cloudflare Dashboard → Pages → Settings → Environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_VERSION` | Node.js version | `20` |
| `ENABLE_ANALYTICS` | Enable analytics | `true` |

### GitHub Actions Variables

Set in GitHub Settings → Secrets and variables → Actions → Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_VERSION` | Node.js version for CI | `20.x` |
| `PNPM_VERSION` | pnpm version | `8.15.0` |

### Configuration Files

#### `.env.example` (apps/pwa)
```bash
# API Configuration
VITE_API_URL=https://api.kids-home-hub.com

# App Configuration
VITE_APP_NAME=Kids Home Hub
VITE_APP_VERSION=2.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=false
```

#### Environment-Specific Files

**`.env.development`** (local dev)
```bash
VITE_API_URL=http://localhost:8787
VITE_ENABLE_DEBUG=true
```

**`.env.production`** (production build)
```bash
VITE_API_URL=https://kids-home-hub.workers.dev
VITE_ENABLE_ANALYTICS=true
```

---

## Testing the Pipeline

### Local Testing

Before pushing, test locally:

```bash
# 1. Run all checks that CI will run
pnpm validate

# 2. Build production bundle
pnpm --filter @kids-hub/pwa build

# 3. Preview production build
pnpm --filter @kids-hub/pwa preview

# 4. Run E2E tests against preview
pnpm test:e2e
```

### Testing CI Pipeline

**For Pull Requests:**

```bash
# 1. Create a feature branch
git checkout -b feature/test-deployment

# 2. Make a small change
echo "// Test" >> apps/pwa/src/app.tsx

# 3. Commit and push
git add .
git commit -m "test: verify CI pipeline"
git push origin feature/test-deployment

# 4. Create PR on GitHub
# 5. Watch Actions tab for pipeline execution
# 6. Verify preview deployment URL in PR comment
```

**Expected Results:**
- ✅ All CI checks pass
- ✅ Preview deployment created
- ✅ PR comment with preview URL
- ✅ Lighthouse scores visible (if configured)

### Testing Production Deployment

**Requires push to `main`:**

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Make a change (or merge a PR)
git merge feature/test-deployment

# 3. Push to main
git push origin main

# 4. Go to GitHub Actions
# 5. Find "Deploy PWA" workflow
# 6. Wait for build to complete
# 7. Approve production deployment when prompted
# 8. Verify smoke tests pass
# 9. Check production URL
```

**Expected Results:**
- ✅ Build completes successfully
- ✅ Deployment awaits approval
- ✅ After approval, deploys to production
- ✅ Smoke tests pass
- ✅ GitHub release created
- ✅ Application accessible at production URL

### Testing Rollback

**Simulate a failed deployment:**

```bash
# 1. Modify smoke test to always fail
# Edit scripts/ci/smoke-test.js
# Change expectedStatus to 500 for health check

# 2. Commit and push to main
git add scripts/ci/smoke-test.js
git commit -m "test: simulate failed deployment"
git push origin main

# 3. Watch deployment fail
# 4. Verify rollback instructions appear
# 5. Perform manual rollback via Cloudflare Dashboard
# 6. Revert the smoke test change
```

### Testing Security Scanning

```bash
# Trigger security scan manually
# 1. Go to Actions tab
# 2. Select "Security Scanning" workflow
# 3. Click "Run workflow"
# 4. Wait for results
# 5. Review any findings
```

---

## Monitoring & Alerts

### Cloudflare Analytics

**Metrics to Monitor:**

1. **Pages Dashboard**
   - Deployment frequency
   - Build success rate
   - Deploy duration

2. **Web Analytics** (if enabled)
   - Page views
   - Unique visitors
   - Performance metrics (Core Web Vitals)

3. **Error Tracking**
   - JavaScript errors
   - Failed requests
   - 404 errors

### GitHub Actions Monitoring

**Workflow Status:**
- Actions tab shows all workflow runs
- Badge in README shows build status
- Email notifications on failure (configure in GitHub settings)

**Metrics to Track:**
- CI pipeline duration (should be < 10 minutes)
- Deployment frequency (how often you deploy)
- Success rate (aim for > 95%)
- Flaky test rate (aim for 0%)

### Slack Notifications (Optional)

If `SLACK_WEBHOOK_URL` is configured:

**Notifications sent for:**
- ✅ CI pipeline success
- ❌ CI pipeline failure
- 🚀 Deployment started
- ✅ Deployment successful
- ❌ Deployment failed
- 🔄 Rollback performed

**Setup:**
1. Create Slack app or incoming webhook
2. Copy webhook URL
3. Add to GitHub secrets as `SLACK_WEBHOOK_URL`

### Custom Monitoring

**Add to workflow:**

```yaml
- name: Send custom metrics
  run: |
    curl -X POST ${{ secrets.METRICS_ENDPOINT }} \
      -H "Content-Type: application/json" \
      -d '{
        "deployment": "${{ needs.build-pwa.outputs.version }}",
        "duration": "${{ job.duration }}",
        "status": "success"
      }'
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails: "Invalid API Token"

**Problem**: Cloudflare API token is invalid or has wrong permissions

**Solution**:
```bash
# Verify token has correct permissions:
# - Cloudflare Pages: Edit
# - Account Settings: Read

# Regenerate token if needed:
# 1. Cloudflare Dashboard → API Tokens
# 2. Edit or create new token
# 3. Update CLOUDFLARE_API_TOKEN secret in GitHub
```

#### 2. Build Fails: "Type Check Errors"

**Problem**: TypeScript errors in code

**Solution**:
```bash
# Run type check locally
pnpm --filter @kids-hub/pwa type-check

# Fix all errors before pushing
# Ensure tsconfig.json is correct
# Check for missing type definitions
```

#### 3. Smoke Tests Fail

**Problem**: Deployed app not responding correctly

**Solution**:
```bash
# Check what's failing
# View workflow logs in GitHub Actions

# Common causes:
# - Environment variables not set
# - API endpoint not configured
# - Service worker issues
# - CORS problems

# Test locally first:
pnpm build
pnpm preview
node scripts/ci/smoke-test.js --url=http://localhost:4173
```

#### 4. Preview Deployment Not Appearing

**Problem**: No preview URL in PR comments

**Solution**:
- Verify `CLOUDFLARE_API_TOKEN` has Pages:Edit permission
- Check workflow logs for errors
- Ensure `GITHUB_TOKEN` has PR write permissions
- Verify PR is from same repository (not a fork)

#### 5. Bundle Size Too Large

**Problem**: Build fails due to bundle size budget

**Solution**:
```bash
# Analyze bundle
pnpm --filter @kids-hub/pwa build
pnpm bundle:analyze

# Common fixes:
# - Use dynamic imports for large components
# - Remove unused dependencies
# - Optimize images
# - Enable tree shaking
```

#### 6. E2E Tests Flaky

**Problem**: Tests pass locally but fail in CI

**Solution**:
```bash
# Common causes:
# - Timing issues (add explicit waits)
# - Different viewports (test multiple sizes)
# - Network speed (add timeouts)
# - Browser differences (test all browsers locally)

# Run E2E in CI mode locally:
CI=true pnpm test:e2e
```

### Getting Help

**Debugging Checklist:**

1. ✅ Check workflow logs in GitHub Actions
2. ✅ Run commands locally to reproduce
3. ✅ Verify all secrets are set correctly
4. ✅ Check Cloudflare Dashboard for errors
5. ✅ Review recent code changes
6. ✅ Check if issue is environment-specific

**Resources:**
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Project CI/CD Documentation](./CI_CD_DOCUMENTATION.md)
- [Deployment Ready Guide](./DEPLOYMENT_READY.md)

**Support:**
- Create GitHub issue with `deployment` label
- Check existing issues and discussions
- Review workflow run logs for error messages

---

## Best Practices

### Deployment Guidelines

1. **Always test locally first**
   ```bash
   pnpm validate && pnpm build
   ```

2. **Use feature branches**
   - Never push directly to `main`
   - Create PR for code review
   - Wait for all checks to pass

3. **Monitor deployments**
   - Watch Actions tab during deployment
   - Check production URL after deploy
   - Review error logs immediately

4. **Keep dependencies updated**
   - Review Dependabot PRs weekly
   - Test updates before merging
   - Check for breaking changes

5. **Document changes**
   - Write clear commit messages
   - Update CHANGELOG.md
   - Add comments to PRs

### Security Best Practices

1. **Never commit secrets**
   - Use GitHub Secrets for sensitive data
   - Add `.env` to `.gitignore`
   - Review commits before pushing

2. **Review dependency updates**
   - Check for security advisories
   - Read changelogs
   - Test thoroughly

3. **Monitor security scans**
   - Fix critical/high vulnerabilities immediately
   - Review weekly security reports
   - Keep dependencies current

### Performance Best Practices

1. **Monitor bundle size**
   - Keep total bundle < 150KB
   - Use code splitting
   - Lazy load large components

2. **Track Lighthouse scores**
   - Maintain scores > 90
   - Fix regressions immediately
   - Test on real devices

3. **Optimize builds**
   - Use production mode
   - Enable compression
   - Remove debug code

---

## Quick Reference

### Useful Commands

```bash
# Local development
pnpm dev                          # Start dev server
pnpm test                         # Run tests
pnpm test:e2e                     # Run E2E tests
pnpm validate                     # Run all checks

# Building
pnpm build                        # Build all packages
pnpm --filter @kids-hub/pwa build # Build PWA only

# Deployment
pnpm --filter @kids-hub/pwa deploy # Deploy PWA to Cloudflare
wrangler pages deploy dist         # Manual Pages deploy

# Testing
node scripts/ci/smoke-test.js --url=<url>  # Run smoke tests
pnpm test:e2e:chromium            # Test specific browser
```

### Environment URLs

| Environment | URL | Deploy Trigger |
|-------------|-----|----------------|
| Local | http://localhost:3000 | `pnpm dev` |
| Preview | Auto-generated by Cloudflare | PR created |
| Production | https://kids-home-hub.pages.dev | Push to `main` |

### Workflow Files

| Workflow | File | Purpose |
|----------|------|---------|
| CI Pipeline | `.github/workflows/ci.yml` | Quality checks |
| PWA Deploy | `.github/workflows/deploy-pwa.yml` | PWA deployment |
| Security | `.github/workflows/security.yml` | Security scans |
| Performance | `.github/workflows/performance.yml` | Performance checks |
| E2E Tests | `.github/workflows/e2e-tests.yml` | Browser testing |

---

## Changelog

### Version 2.0.0 (2025-11-23)
- ✨ Created comprehensive PWA deployment workflow
- ✨ Added Cloudflare Pages integration
- ✨ Implemented preview deployments for PRs
- ✨ Added post-deployment validation
- ✨ Created complete deployment guide
- ✨ Added rollback procedures
- ✨ Enhanced smoke tests

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-23
**Maintained By**: DevOps Team
**Review Schedule**: Quarterly
